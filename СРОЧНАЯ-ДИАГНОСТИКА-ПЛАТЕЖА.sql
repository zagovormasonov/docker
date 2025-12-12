-- =============================================
-- СРОЧНАЯ ДИАГНОСТИКА ПРОБЛЕМЫ С ПЛАТЕЖОМ
-- =============================================

-- 1. Показать последние платежи и статусы пользователей
SELECT 
    '=== ПОСЛЕДНИЕ ПЛАТЕЖИ (10 ШТУК) ===' as section;

SELECT 
    p.id as payment_id,
    p.plan_id,
    p.amount,
    p.status as payment_status,
    p.yookassa_payment_id,
    u.id as user_id,
    u.email,
    u.name,
    u.user_type as текущий_статус,
    p.created_at as дата_платежа,
    p.updated_at as дата_обновления,
    CASE 
        WHEN p.status = 'succeeded' AND p.plan_id IN ('monthly', 'yearly') AND u.user_type != 'expert' 
            THEN '❌ НЕ СТАЛ ЭКСПЕРТОМ!'
        WHEN p.status = 'succeeded' AND p.plan_id IN ('monthly', 'yearly') AND u.user_type = 'expert' 
            THEN '✅ ВСЕ ОК'
        WHEN p.status = 'pending'
            THEN '⏳ ОЖИДАЕТ'
        ELSE '⚠️ ДРУГОЕ'
    END as диагноз
FROM payments p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 2. Показать ТОЛЬКО проблемные платежи (успешные, но не эксперты)
SELECT 
    '=== ПРОБЛЕМНЫЕ ПЛАТЕЖИ (УСПЕШНЫЕ, НО НЕ ЭКСПЕРТ) ===' as section;

SELECT 
    p.id as payment_id,
    p.plan_id,
    p.amount,
    p.yookassa_payment_id,
    u.id as user_id,
    u.email,
    u.name,
    u.user_type,
    p.created_at as оплачено,
    p.status as статус_платежа
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'succeeded' 
  AND p.plan_id IN ('monthly', 'yearly')
  AND u.user_type != 'expert'
ORDER BY p.created_at DESC;

-- 3. Показать статистику по всем платежам
SELECT 
    '=== СТАТИСТИКА ===' as section;

SELECT 
    plan_id,
    status,
    COUNT(*) as количество
FROM payments
GROUP BY plan_id, status
ORDER BY plan_id, status;

-- 4. Показать пользователей по типам
SELECT 
    '=== ПОЛЬЗОВАТЕЛИ ПО ТИПАМ ===' as section;

SELECT 
    user_type,
    COUNT(*) as количество
FROM users
GROUP BY user_type
ORDER BY user_type;











