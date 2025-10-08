-- Быстрое исправление отображения авторов

-- 1. Добавляем author_id в events
ALTER TABLE events ADD COLUMN IF NOT EXISTS author_id INTEGER;

-- 2. Устанавливаем author_id = 1 для всех записей
UPDATE events SET author_id = 1 WHERE author_id IS NULL;

-- 3. Делаем колонку NOT NULL
ALTER TABLE events ALTER COLUMN author_id SET NOT NULL;

-- 4. Добавляем внешний ключ
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS fk_events_author_id 
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Добавляем author_id в articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id INTEGER;

-- 6. Устанавливаем author_id = 1 для всех записей
UPDATE articles SET author_id = 1 WHERE author_id IS NULL;

-- 7. Делаем колонку NOT NULL
ALTER TABLE articles ALTER COLUMN author_id SET NOT NULL;

-- 8. Добавляем внешний ключ
ALTER TABLE articles ADD CONSTRAINT IF NOT EXISTS fk_articles_author_id 
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. Проверяем результат
SELECT 
    'events' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id
FROM events
UNION ALL
SELECT 
    'articles' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id
FROM articles;
