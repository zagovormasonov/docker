-- Комплексная очистка дублирующихся тематик из базы данных
-- Этот скрипт удаляет все дублирующиеся тематики и оставляет только уникальные

-- 1. Удаляем дублирующиеся тематики, которые были указаны пользователем
DELETE FROM topics WHERE name IN (
    'Гвоздестояние, Садху',
    'Кинезиология, PDTR-терапия', 
    'Расстановки, системные расстановки',
    'Тантра',
    'Хьюман дизайн',
    'Хьюман Дизайн',
    'Гвоздестояние',
    'Кинезиология', 
    'Расстановки'
);

-- 2. Удаляем возможные дубликаты с разным написанием
DELETE FROM topics WHERE LOWER(TRIM(name)) IN (
    'гвоздестояние',
    'кинезиология', 
    'расстановки',
    'тантра',
    'хьюман дизайн',
    'хьюман дизайн'
);

-- 3. Проверяем и удаляем дубликаты по похожим названиям
-- Удаляем варианты с разными регистрами и пробелами
WITH duplicates AS (
    SELECT name, 
           LOWER(TRIM(name)) as normalized_name,
           ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY name) as rn
    FROM topics
)
DELETE FROM topics 
WHERE name IN (
    SELECT name FROM duplicates WHERE rn > 1
);

-- 4. Проверяем результат
SELECT 'Оставшиеся тематики:' as status;
SELECT COUNT(*) as total_topics FROM topics;
SELECT name FROM topics ORDER BY name;

-- 5. Показываем статистику
SELECT 'Статистика очистки:' as status;
SELECT 
    COUNT(*) as remaining_topics,
    MIN(name) as first_topic,
    MAX(name) as last_topic
FROM topics;
