-- Исправление отображения авторов и картинок в событиях

-- 1. Проверяем структуру таблицы events
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. Добавляем колонку cover_image если её нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'cover_image') THEN
        ALTER TABLE events ADD COLUMN cover_image VARCHAR(500);
        RAISE NOTICE 'Добавлена колонка cover_image в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка cover_image уже существует в таблице events';
    END IF;
END $$;

-- 3. Добавляем колонку cover_image в articles если её нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'cover_image') THEN
        ALTER TABLE articles ADD COLUMN cover_image VARCHAR(500);
        RAISE NOTICE 'Добавлена колонка cover_image в таблицу articles';
    ELSE
        RAISE NOTICE 'Колонка cover_image уже существует в таблице articles';
    END IF;
END $$;

-- 4. Проверяем, что author_id существует и заполнен
SELECT 
    'events' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as non_null_author_ids
FROM events
UNION ALL
SELECT 
    'articles' as table_name,
    COUNT(*) as total_records,
    COUNT(author_id) as records_with_author_id,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as non_null_author_ids
FROM articles;

-- 5. Если есть записи без author_id, устанавливаем их
UPDATE events SET author_id = 1 WHERE author_id IS NULL;
UPDATE articles SET author_id = 1 WHERE author_id IS NULL;

-- 6. Проверяем финальную структуру
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 7. Проверяем, что все записи имеют author_id
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
