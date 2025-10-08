-- Простая проверка результата

-- 1. Проверяем структуру таблицы articles
SELECT 
    'articles' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- 2. Проверяем структуру таблицы events
SELECT 
    'events' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 3. Проверяем, что колонки author_id существуют
SELECT 
    'articles' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status
UNION ALL
SELECT 
    'events' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status;

-- 4. Проверяем количество записей
SELECT 'articles' as table_name, COUNT(*) as record_count FROM articles
UNION ALL
SELECT 'events' as table_name, COUNT(*) as record_count FROM events;
