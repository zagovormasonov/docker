-- Исправление отображения авторов в админской панели

-- 1. Проверяем, есть ли колонка author_id в таблице events
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status;

-- 2. Если колонки нет, добавляем её
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'author_id') THEN
        ALTER TABLE events ADD COLUMN author_id INTEGER;
        
        -- Устанавливаем author_id = 1 для всех существующих записей
        -- ВАЖНО: Замените 1 на реальный ID администратора!
        UPDATE events SET author_id = 1 WHERE author_id IS NULL;
        
        -- Делаем колонку NOT NULL
        ALTER TABLE events ALTER COLUMN author_id SET NOT NULL;
        
        -- Добавляем внешний ключ
        ALTER TABLE events ADD CONSTRAINT fk_events_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Добавлена колонка author_id в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка author_id уже существует в таблице events';
    END IF;
END $$;

-- 3. Проверяем, есть ли колонка author_id в таблице articles
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as articles_author_id_status;

-- 4. Если колонки нет в articles, добавляем её
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'author_id') THEN
        ALTER TABLE articles ADD COLUMN author_id INTEGER;
        
        -- Устанавливаем author_id = 1 для всех существующих записей
        UPDATE articles SET author_id = 1 WHERE author_id IS NULL;
        
        -- Делаем колонку NOT NULL
        ALTER TABLE articles ALTER COLUMN author_id SET NOT NULL;
        
        -- Добавляем внешний ключ
        ALTER TABLE articles ADD CONSTRAINT fk_articles_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Добавлена колонка author_id в таблицу articles';
    ELSE
        RAISE NOTICE 'Колонка author_id уже существует в таблице articles';
    END IF;
END $$;

-- 5. Проверяем результат
SELECT 
    'events' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status
UNION ALL
SELECT 
    'articles' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status;

-- 6. Проверяем, что все записи имеют author_id
SELECT 
    'events' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id
FROM events
UNION ALL
SELECT 
    'articles' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id
FROM articles;
