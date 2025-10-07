-- Исправляем проблему с колонкой is_published в таблице events
-- Выполните эти команды в вашей базе данных

-- 1. Добавляем колонку is_published если её нет
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 2. Обновляем существующие события
UPDATE events SET is_published = true WHERE moderation_status = 'approved' OR moderation_status IS NULL;

-- 3. Проверяем, что колонка добавлена
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
ORDER BY column_name;

-- 4. Проверяем данные в таблице
SELECT id, title, moderation_status, is_published, created_at 
FROM events 
ORDER BY created_at DESC 
LIMIT 5;


