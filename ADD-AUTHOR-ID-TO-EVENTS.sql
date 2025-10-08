-- Добавляем author_id в таблицу events

-- 1. Проверяем текущую структуру
SELECT 'BEFORE' as status, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'author_id';

-- 2. Добавляем author_id если его нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'author_id') THEN
        -- Добавляем колонку author_id
        ALTER TABLE events ADD COLUMN author_id INTEGER;
        RAISE NOTICE 'Добавлена колонка author_id в таблицу events';
        
        -- Устанавливаем author_id = organizer_id для существующих записей
        UPDATE events SET author_id = organizer_id WHERE author_id IS NULL;
        RAISE NOTICE 'Установлен author_id = organizer_id для существующих записей';
        
        -- Если все еще есть NULL значения, устанавливаем author_id = 1
        UPDATE events SET author_id = 1 WHERE author_id IS NULL;
        RAISE NOTICE 'Установлен author_id = 1 для записей без organizer_id';
        
        -- Делаем колонку NOT NULL
        ALTER TABLE events ALTER COLUMN author_id SET NOT NULL;
        RAISE NOTICE 'Установлен NOT NULL для author_id';
        
        -- Добавляем внешний ключ
        ALTER TABLE events ADD CONSTRAINT fk_events_author_id 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Добавлен внешний ключ для author_id';
        
    ELSE
        RAISE NOTICE 'Колонка author_id уже существует в таблице events';
        
        -- Проверяем, есть ли NULL значения
        IF EXISTS (SELECT 1 FROM events WHERE author_id IS NULL) THEN
            -- Устанавливаем author_id = organizer_id для записей с NULL
            UPDATE events SET author_id = organizer_id WHERE author_id IS NULL;
            RAISE NOTICE 'Обновлен author_id = organizer_id для записей с NULL';
            
            -- Если все еще есть NULL значения, устанавливаем author_id = 1
            UPDATE events SET author_id = 1 WHERE author_id IS NULL;
            RAISE NOTICE 'Установлен author_id = 1 для оставшихся записей с NULL';
        END IF;
    END IF;
END $$;

-- 3. Проверяем результат
SELECT 'AFTER' as status, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'author_id';

-- 4. Проверяем данные
SELECT 
    COUNT(*) as total_events,
    COUNT(author_id) as events_with_author_id,
    MIN(author_id) as min_author_id,
    MAX(author_id) as max_author_id
FROM events;

-- 5. Показываем пример данных
SELECT 
    id, 
    title, 
    author_id, 
    organizer_id,
    CASE WHEN author_id = organizer_id THEN 'SAME' ELSE 'DIFFERENT' END as comparison
FROM events 
LIMIT 5;
