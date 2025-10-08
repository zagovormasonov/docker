-- Добавление недостающих колонок в таблицу events

-- 1. Добавляем is_published если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
        ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Добавлена колонка is_published в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка is_published уже существует в таблице events';
    END IF;
END $$;

-- 2. Добавляем updated_at если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'updated_at') THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Добавлена колонка updated_at в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка updated_at уже существует в таблице events';
    END IF;
END $$;

-- 3. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- 5. Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 6. Проверяем, что все необходимые колонки существуют
SELECT 
    'is_published' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'updated_at' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'updated_at'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;
