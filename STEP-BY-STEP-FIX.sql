-- Пошаговое исправление таблиц

-- 1. Проверяем текущую структуру таблицы events
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. Проверяем текущую структуру таблицы articles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- 3. Добавляем author_id в events если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'author_id') THEN
        ALTER TABLE events ADD COLUMN author_id INTEGER;
        RAISE NOTICE 'Добавлена колонка author_id в таблицу events';
        
        -- Устанавливаем author_id = 1 для всех существующих записей
        UPDATE events SET author_id = 1 WHERE author_id IS NULL;
        
        -- Делаем колонку NOT NULL
        ALTER TABLE events ALTER COLUMN author_id SET NOT NULL;
        
        -- Добавляем внешний ключ
        ALTER TABLE events ADD CONSTRAINT fk_events_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Настроена колонка author_id в таблице events';
    ELSE
        RAISE NOTICE 'Колонка author_id уже существует в таблице events';
    END IF;
END $$;

-- 4. Добавляем author_id в articles если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'author_id') THEN
        ALTER TABLE articles ADD COLUMN author_id INTEGER;
        RAISE NOTICE 'Добавлена колонка author_id в таблицу articles';
        
        -- Устанавливаем author_id = 1 для всех существующих записей
        UPDATE articles SET author_id = 1 WHERE author_id IS NULL;
        
        -- Делаем колонку NOT NULL
        ALTER TABLE articles ALTER COLUMN author_id SET NOT NULL;
        
        -- Добавляем внешний ключ
        ALTER TABLE articles ADD CONSTRAINT fk_articles_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Настроена колонка author_id в таблице articles';
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

-- 6. Теперь проверяем количество записей
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
