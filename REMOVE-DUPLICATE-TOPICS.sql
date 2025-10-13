-- Также удаляем возможные варианты с разным написанием
DELETE FROM topics WHERE name IN (
    'Хьюман Дизайн',  -- вариант с большой буквы
    'Гвоздестояние',
    'Кинезиология', 
    'Расстановки',
    'Тантра'
);

-- Проверяем результат
SELECT COUNT(*) as total_topics FROM topics;
SELECT name FROM topics ORDER BY name;
