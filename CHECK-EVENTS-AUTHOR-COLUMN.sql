-- Проверяем структуру таблицы events
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Проверяем, есть ли author_id
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'author_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as author_id_status;

-- Если author_id есть, проверяем данные
SELECT 
    COUNT(*) as total_events,
    COUNT(author_id) as events_with_author_id,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as non_null_author_ids
FROM events;
