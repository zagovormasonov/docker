-- =============================================
-- ДОБАВЛЕНИЕ ЗАКРЕПЛЕННЫХ СТАТЕЙ НА ГЛАВНОЙ
-- =============================================
-- 
-- Эта миграция добавляет возможность закреплять до 3 статей
-- вверху списка на главной странице
-- 
-- =============================================

-- 1. Добавляем поля для закрепления статей
DO $$
BEGIN
    -- Добавляем поле is_pinned (закреплена ли статья)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'is_pinned'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_pinned BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Добавлено поле is_pinned в таблицу articles';
    ELSE
        RAISE NOTICE 'ℹ️  Поле is_pinned уже существует';
    END IF;

    -- Добавляем поле pin_order (порядок закрепленной статьи: 1, 2, 3)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'pin_order'
    ) THEN
        ALTER TABLE articles ADD COLUMN pin_order INTEGER;
        RAISE NOTICE '✅ Добавлено поле pin_order в таблицу articles';
    ELSE
        RAISE NOTICE 'ℹ️  Поле pin_order уже существует';
    END IF;

    -- Добавляем поле pinned_at (дата закрепления)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'pinned_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN pinned_at TIMESTAMP;
        RAISE NOTICE '✅ Добавлено поле pinned_at в таблицу articles';
    ELSE
        RAISE NOTICE 'ℹ️  Поле pinned_at уже существует';
    END IF;

    -- Добавляем поле pinned_by (кто закрепил статью - ID администратора)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'pinned_by'
    ) THEN
        ALTER TABLE articles ADD COLUMN pinned_by INTEGER REFERENCES users(id);
        RAISE NOTICE '✅ Добавлено поле pinned_by в таблицу articles';
    ELSE
        RAISE NOTICE 'ℹ️  Поле pinned_by уже существует';
    END IF;
END $$;

-- 2. Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_articles_is_pinned ON articles(is_pinned);
CREATE INDEX IF NOT EXISTS idx_articles_pin_order ON articles(pin_order);

-- 3. Добавляем комментарии
COMMENT ON COLUMN articles.is_pinned IS 'Закреплена ли статья на главной странице';
COMMENT ON COLUMN articles.pin_order IS 'Порядок закрепления (1-3)';
COMMENT ON COLUMN articles.pinned_at IS 'Дата и время закрепления';
COMMENT ON COLUMN articles.pinned_by IS 'ID администратора, который закрепил статью';

-- 4. Создаем ограничение: максимум 3 закрепленные статьи
-- Создаем триггер-функцию для проверки
CREATE OR REPLACE FUNCTION check_pinned_articles_limit()
RETURNS TRIGGER AS $$
DECLARE
    pinned_count INTEGER;
BEGIN
    IF NEW.is_pinned = true THEN
        -- Считаем количество уже закрепленных статей (исключая текущую)
        SELECT COUNT(*) INTO pinned_count
        FROM articles
        WHERE is_pinned = true AND id != COALESCE(NEW.id, 0);
        
        IF pinned_count >= 3 THEN
            RAISE EXCEPTION 'Нельзя закрепить больше 3 статей. Открепите одну из существующих.';
        END IF;
        
        -- Автоматически устанавливаем pin_order
        IF NEW.pin_order IS NULL THEN
            SELECT COALESCE(MAX(pin_order), 0) + 1 INTO NEW.pin_order
            FROM articles
            WHERE is_pinned = true;
        END IF;
        
        -- Устанавливаем время закрепления
        IF NEW.pinned_at IS NULL THEN
            NEW.pinned_at = CURRENT_TIMESTAMP;
        END IF;
    ELSE
        -- Если открепляем статью, сбрасываем поля
        NEW.pin_order = NULL;
        NEW.pinned_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггер
DROP TRIGGER IF EXISTS trigger_check_pinned_articles_limit ON articles;
CREATE TRIGGER trigger_check_pinned_articles_limit
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION check_pinned_articles_limit();

-- 6. Создаем функцию для получения закрепленных статей
CREATE OR REPLACE FUNCTION get_pinned_articles()
RETURNS TABLE(
    id INTEGER,
    title VARCHAR,
    content TEXT,
    author_id INTEGER,
    author_name VARCHAR,
    author_avatar VARCHAR,
    cover_image VARCHAR,
    views INTEGER,
    likes_count INTEGER,
    pin_order INTEGER,
    pinned_at TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.author_id,
        u.name as author_name,
        u.avatar_url as author_avatar,
        a.cover_image,
        a.views,
        COALESCE(a.likes_count, 0) as likes_count,
        a.pin_order,
        a.pinned_at,
        a.created_at
    FROM articles a
    JOIN users u ON a.author_id = u.id
    WHERE a.is_pinned = true 
      AND a.is_published = true
      AND (a.archived = false OR a.archived IS NULL)
    ORDER BY a.pin_order ASC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- 7. Создаем функцию для закрепления статьи (с проверкой прав админа)
CREATE OR REPLACE FUNCTION pin_article(
    p_article_id INTEGER,
    p_admin_id INTEGER,
    p_pin_order INTEGER DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    article_id INTEGER,
    pin_order INTEGER
) AS $$
DECLARE
    v_admin_type VARCHAR;
    v_pinned_count INTEGER;
    v_new_pin_order INTEGER;
BEGIN
    -- Проверяем права администратора
    SELECT user_type INTO v_admin_type
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_type != 'admin' THEN
        RETURN QUERY SELECT false, 'Недостаточно прав. Требуются права администратора.'::TEXT, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Проверяем существование статьи
    IF NOT EXISTS (SELECT 1 FROM articles WHERE id = p_article_id) THEN
        RETURN QUERY SELECT false, 'Статья не найдена.'::TEXT, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Проверяем, уже закреплена ли статья
    IF EXISTS (SELECT 1 FROM articles WHERE id = p_article_id AND is_pinned = true) THEN
        RETURN QUERY SELECT false, 'Статья уже закреплена.'::TEXT, p_article_id, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Считаем количество закрепленных статей
    SELECT COUNT(*) INTO v_pinned_count
    FROM articles
    WHERE is_pinned = true;
    
    IF v_pinned_count >= 3 THEN
        RETURN QUERY SELECT false, 'Уже закреплено максимальное количество статей (3). Открепите одну из существующих.'::TEXT, NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Определяем порядок закрепления
    IF p_pin_order IS NOT NULL AND p_pin_order BETWEEN 1 AND 3 THEN
        v_new_pin_order := p_pin_order;
    ELSE
        SELECT COALESCE(MAX(pin_order), 0) + 1 INTO v_new_pin_order
        FROM articles
        WHERE is_pinned = true;
    END IF;
    
    -- Закрепляем статью
    UPDATE articles
    SET is_pinned = true,
        pin_order = v_new_pin_order,
        pinned_at = CURRENT_TIMESTAMP,
        pinned_by = p_admin_id
    WHERE id = p_article_id;
    
    RETURN QUERY SELECT true, 'Статья успешно закреплена.'::TEXT, p_article_id, v_new_pin_order;
END;
$$ LANGUAGE plpgsql;

-- 8. Создаем функцию для открепления статьи
CREATE OR REPLACE FUNCTION unpin_article(
    p_article_id INTEGER,
    p_admin_id INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_admin_type VARCHAR;
    v_old_pin_order INTEGER;
BEGIN
    -- Проверяем права администратора
    SELECT user_type INTO v_admin_type
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_type != 'admin' THEN
        RETURN QUERY SELECT false, 'Недостаточно прав. Требуются права администратора.'::TEXT;
        RETURN;
    END IF;
    
    -- Получаем старый порядок
    SELECT pin_order INTO v_old_pin_order
    FROM articles
    WHERE id = p_article_id AND is_pinned = true;
    
    IF v_old_pin_order IS NULL THEN
        RETURN QUERY SELECT false, 'Статья не закреплена.'::TEXT;
        RETURN;
    END IF;
    
    -- Открепляем статью
    UPDATE articles
    SET is_pinned = false,
        pin_order = NULL,
        pinned_at = NULL,
        pinned_by = NULL
    WHERE id = p_article_id;
    
    -- Пересчитываем порядок оставшихся закрепленных статей
    UPDATE articles
    SET pin_order = pin_order - 1
    WHERE is_pinned = true AND pin_order > v_old_pin_order;
    
    RETURN QUERY SELECT true, 'Статья успешно откреплена.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 9. Проверяем результат
SELECT 
    '=== ЗАКРЕПЛЕННЫЕ СТАТЬИ ===' as section;

SELECT 
    id,
    title,
    is_pinned as "закреплена",
    pin_order as "порядок",
    pinned_at as "дата_закрепления",
    pinned_by as "admin_id"
FROM articles 
WHERE is_pinned = true
ORDER BY pin_order ASC;

-- 10. Информация об использовании
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Добавлены поля:';
    RAISE NOTICE '   - is_pinned (закреплена ли статья)';
    RAISE NOTICE '   - pin_order (порядок: 1-3)';
    RAISE NOTICE '   - pinned_at (дата закрепления)';
    RAISE NOTICE '   - pinned_by (кто закрепил)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Созданные функции:';
    RAISE NOTICE '   - get_pinned_articles() - получить закрепленные статьи';
    RAISE NOTICE '   - pin_article(article_id, admin_id) - закрепить статью';
    RAISE NOTICE '   - unpin_article(article_id, admin_id) - открепить статью';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Примеры использования:';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Получить закрепленные статьи:';
    RAISE NOTICE '   SELECT * FROM get_pinned_articles();';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Закрепить статью (admin_id = 1, article_id = 5):';
    RAISE NOTICE '   SELECT * FROM pin_article(5, 1);';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Открепить статью:';
    RAISE NOTICE '   SELECT * FROM unpin_article(5, 1);';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ОГРАНИЧЕНИЕ: Максимум 3 закрепленные статьи одновременно';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
END $$;

