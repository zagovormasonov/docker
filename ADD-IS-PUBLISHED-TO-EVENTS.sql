-- Добавляем колонку is_published в таблицу events

-- 1. Проверяем, существует ли колонка is_published
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_published_status;

-- 2. Добавляем колонку is_published если её нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
        ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT false;
        RAISE NOTICE 'Добавлена колонка is_published в таблицу events';
        
        -- Устанавливаем is_published = true для существующих событий
        UPDATE events SET is_published = true WHERE is_published IS NULL;
        RAISE NOTICE 'Установлен is_published = true для существующих событий';
        
    ELSE
        RAISE NOTICE 'Колонка is_published уже существует в таблице events';
    END IF;
END $$;

-- 3. Проверяем результат
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_published_status;

-- 4. Показываем структуру таблицы events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 5. Проверяем данные
SELECT 
    COUNT(*) as total_events,
    COUNT(is_published) as events_with_is_published,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_events,
    COUNT(CASE WHEN is_published = false THEN 1 END) as unpublished_events
FROM events;
