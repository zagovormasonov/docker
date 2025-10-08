-- Проверка реальной структуры таблицы events

-- 1. Проверяем, существует ли таблица events
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'events'
) as events_table_exists;

-- 2. Если таблица существует, показываем её структуру
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 3. Проверяем, есть ли данные в таблице
SELECT COUNT(*) as total_events FROM events;

-- 4. Показываем первые несколько записей (если есть)
SELECT * FROM events LIMIT 3;
