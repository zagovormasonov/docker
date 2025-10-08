-- Диагностика базы данных

-- 1. Проверяем существование таблиц
SELECT 
    table_name,
    CASE WHEN table_name IN (
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (VALUES 
    ('users'),
    ('articles'), 
    ('events'),
    ('notifications')
) AS required_tables(table_name);

-- 2. Проверяем структуру таблицы articles (если существует)
SELECT 
    'articles' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- 3. Проверяем структуру таблицы events (если существует)
SELECT 
    'events' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 4. Проверяем структуру таблицы users
SELECT 
    'users' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Проверяем, есть ли данные в таблицах
SELECT 'articles' as table_name, COUNT(*) as record_count FROM articles
UNION ALL
SELECT 'events' as table_name, COUNT(*) as record_count FROM events
UNION ALL  
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;
