-- Добавление поля archived в таблицу articles для архивирования статей

-- 1. Проверяем существование таблицы articles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        RAISE NOTICE 'Создаем таблицу articles...';
        
        CREATE TABLE articles (
            id SERIAL PRIMARY KEY,
            author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            cover_image VARCHAR(500),
            is_published BOOLEAN DEFAULT true,
            archived BOOLEAN DEFAULT false,
            views INTEGER DEFAULT 0,
            likes_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Создаем индексы
        CREATE INDEX idx_articles_author_id ON articles(author_id);
        CREATE INDEX idx_articles_published ON articles(is_published);
        CREATE INDEX idx_articles_archived ON articles(archived);
        CREATE INDEX idx_articles_created_at ON articles(created_at);
        
        RAISE NOTICE 'Таблица articles создана успешно!';
    ELSE
        RAISE NOTICE 'Таблица articles уже существует.';
    END IF;
END $$;

-- 2. Добавляем поле archived если его нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'archived'
    ) THEN
        RAISE NOTICE 'Добавляем поле archived...';
        
        ALTER TABLE articles ADD COLUMN archived BOOLEAN DEFAULT false;
        
        -- Создаем индекс для архивированных статей
        CREATE INDEX IF NOT EXISTS idx_articles_archived ON articles(archived);
        
        RAISE NOTICE 'Поле archived добавлено успешно!';
    ELSE
        RAISE NOTICE 'Поле archived уже существует.';
    END IF;
END $$;

-- 3. Добавляем другие недостающие поля если их нет
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Проверяем наличие всех необходимых колонок
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'likes_count') THEN
        missing_columns := array_append(missing_columns, 'likes_count');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'cover_image') THEN
        missing_columns := array_append(missing_columns, 'cover_image');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'views') THEN
        missing_columns := array_append(missing_columns, 'views');
    END IF;
    
    -- Добавляем недостающие колонки
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Добавляем недостающие колонки: %', array_to_string(missing_columns, ', ');
        
        IF 'likes_count' = ANY(missing_columns) THEN
            ALTER TABLE articles ADD COLUMN likes_count INTEGER DEFAULT 0;
        END IF;
        
        IF 'cover_image' = ANY(missing_columns) THEN
            ALTER TABLE articles ADD COLUMN cover_image VARCHAR(500);
        END IF;
        
        IF 'views' = ANY(missing_columns) THEN
            ALTER TABLE articles ADD COLUMN views INTEGER DEFAULT 0;
        END IF;
        
        RAISE NOTICE 'Колонки добавлены успешно!';
    ELSE
        RAISE NOTICE 'Все необходимые колонки присутствуют.';
    END IF;
END $$;

-- 4. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_articles_updated_at_column();

-- 6. Проверяем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- 7. Проверяем статистику статей
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_articles,
    COUNT(CASE WHEN archived = true THEN 1 END) as archived_articles,
    COUNT(CASE WHEN is_published = true AND archived = false THEN 1 END) as active_articles
FROM articles;

-- 8. Показываем примеры статей
SELECT 
    id,
    title,
    is_published,
    archived,
    created_at,
    updated_at
FROM articles 
ORDER BY created_at DESC 
LIMIT 5;
