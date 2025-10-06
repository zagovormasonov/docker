-- Добавляем колонку is_published в таблицу events
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Обновляем существующие события
UPDATE events SET is_published = true WHERE moderation_status = 'approved' OR moderation_status IS NULL;

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
ORDER BY column_name;

