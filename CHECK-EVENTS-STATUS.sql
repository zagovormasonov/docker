-- Проверяем статус событий и их видимость

-- 1. Проверяем структуру таблицы events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. Проверяем, какие события есть в базе
SELECT 
    id,
    title,
    event_date,
    CASE 
        WHEN moderation_status IS NOT NULL THEN moderation_status
        ELSE 'NO_MODERATION_STATUS'
    END as moderation_status,
    CASE 
        WHEN is_published IS NOT NULL THEN is_published
        ELSE 'NO_IS_PUBLISHED'
    END as is_published,
    CASE 
        WHEN event_date >= NOW() THEN 'FUTURE'
        ELSE 'PAST'
    END as date_status
FROM events 
ORDER BY event_date DESC;

-- 3. Проверяем, какие события должны быть видны
SELECT 
    'Всего событий' as category,
    COUNT(*) as count
FROM events
UNION ALL
SELECT 
    'Будущие события',
    COUNT(*)
FROM events 
WHERE event_date >= NOW()
UNION ALL
SELECT 
    'События с moderation_status = approved',
    COUNT(*)
FROM events 
WHERE moderation_status = 'approved'
UNION ALL
SELECT 
    'События с moderation_status IS NULL',
    COUNT(*)
FROM events 
WHERE moderation_status IS NULL
UNION ALL
SELECT 
    'События с is_published = true',
    COUNT(*)
FROM events 
WHERE is_published = true
UNION ALL
SELECT 
    'События без фильтрации (должны быть видны)',
    COUNT(*)
FROM events 
WHERE event_date >= NOW() 
AND (moderation_status = 'approved' OR moderation_status IS NULL);

-- 4. Проверяем конкретные события, которые должны быть видны
SELECT 
    id,
    title,
    event_date,
    moderation_status,
    is_published,
    'SHOULD_BE_VISIBLE' as visibility_status
FROM events 
WHERE event_date >= NOW() 
AND (moderation_status = 'approved' OR moderation_status IS NULL)
ORDER BY event_date ASC;
