-- Добавление колонки is_published в таблицы

-- 1. Добавляем is_published в articles если нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'is_published') THEN
        ALTER TABLE articles ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Добавлена колонка is_published в таблицу articles';
    ELSE
        RAISE NOTICE 'Колонка is_published уже существует в таблице articles';
    END IF;
END $$;

-- 2. Добавляем is_published в events если нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
        ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Добавлена колонка is_published в таблицу events';
    ELSE
        RAISE NOTICE 'Колонка is_published уже существует в таблице events';
    END IF;
END $$;

-- 3. Проверяем результат
SELECT 
    'articles' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_published_status
UNION ALL
SELECT 
    'events' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_published'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_published_status;
