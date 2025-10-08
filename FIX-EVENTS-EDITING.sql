-- Исправление таблицы events для редактирования и удаления

-- 1. Проверяем текущую структуру
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. Добавляем author_id если его нет
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

-- 3. Добавляем is_published если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
        ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Добавлена колонка is_published в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка is_published уже существует в таблице events';
    END IF;
END $$;

-- 4. Добавляем created_at если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_at') THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Добавлена колонка created_at в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка created_at уже существует в таблице events';
    END IF;
END $$;

-- 5. Добавляем updated_at если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'updated_at') THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Добавлена колонка updated_at в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка updated_at уже существует в таблице events';
    END IF;
END $$;

-- 6. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_events_author_id ON events(author_id);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);

-- 7. Создаем функцию для updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Создаем триггер для updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- 9. Проверяем финальную структуру
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 10. Проверяем, что все записи имеют author_id
SELECT 
    COUNT(*) as total_events,
    COUNT(author_id) as events_with_author_id,
    COUNT(*) - COUNT(author_id) as events_without_author_id
FROM events;
