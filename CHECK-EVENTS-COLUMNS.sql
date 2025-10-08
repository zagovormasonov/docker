-- Проверка колонок в таблице events

-- 1. Проверяем все колонки в таблице events
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. Проверяем, есть ли колонка is_published
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_published_status;

-- 3. Проверяем, есть ли колонка updated_at
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'updated_at'
    ) THEN 'EXISTS' ELSE 'MISSING' END as updated_at_status;

-- 4. Проверяем данные в таблице
SELECT COUNT(*) as total_events FROM events;
SELECT * FROM events LIMIT 3;
