-- Исправление таблицы articles

-- Проверяем структуру таблицы articles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- Добавляем колонку author_id если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN author_id INTEGER;
        
        -- Если есть данные, устанавливаем author_id = 1 (первый пользователь)
        -- ВАЖНО: Замените 1 на реальный ID пользователя-администратора
        UPDATE articles SET author_id = 1 WHERE author_id IS NULL;
        
        -- Делаем колонку NOT NULL после заполнения
        ALTER TABLE articles ALTER COLUMN author_id SET NOT NULL;
        
        -- Добавляем внешний ключ
        ALTER TABLE articles ADD CONSTRAINT fk_articles_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Проверяем, есть ли колонка is_published
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'is_published'
    ) THEN
        ALTER TABLE articles ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Проверяем, есть ли колонка created_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Проверяем, есть ли колонка updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_articles_updated_at();

-- Проверяем финальную структуру
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;
