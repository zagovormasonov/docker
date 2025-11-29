-- =============================================
-- Исправление автоматического назначения статуса эксперта
-- при оплате через Юкассу (monthly и yearly подписки)
-- =============================================

-- 1. Проверяем текущую ситуацию с платежами
SELECT 
    '=== АНАЛИЗ ПЛАТЕЖЕЙ ===' as section;

-- 2. Показываем все успешные платежи и статусы пользователей
SELECT 
    p.id as payment_id,
    p.plan_id,
    p.amount,
    p.status as payment_status,
    p.yookassa_payment_id,
    u.id as user_id,
    u.email,
    u.name,
    u.user_type as current_user_type,
    p.created_at as payment_date,
    CASE 
        WHEN p.status = 'succeeded' AND p.plan_id IN ('monthly', 'yearly') AND u.user_type != 'expert' 
            THEN '⚠️ ТРЕБУЕТ ИСПРАВЛЕНИЯ'
        WHEN p.status = 'succeeded' AND p.plan_id IN ('monthly', 'yearly') AND u.user_type = 'expert' 
            THEN '✅ ВСЕ ПРАВИЛЬНО'
        WHEN p.status = 'pending' AND p.created_at < NOW() - INTERVAL '1 hour' 
            THEN '🔄 ДОЛГО ОЖИДАЕТ'
        ELSE 'ℹ️ OK'
    END as status_check
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status IN ('pending', 'succeeded')
ORDER BY p.created_at DESC;

-- 3. Показываем статистику
SELECT 
    '=== СТАТИСТИКА ПЛАТЕЖЕЙ ===' as section;

SELECT 
    plan_id,
    status,
    COUNT(*) as count
FROM payments
GROUP BY plan_id, status
ORDER BY plan_id, status;

-- 4. Показываем проблемные случаи (успешный платеж, но не эксперт)
SELECT 
    '=== ПРОБЛЕМНЫЕ ПЛАТЕЖИ (УСПЕШНЫЕ, НО ПОЛЬЗОВАТЕЛЬ НЕ ЭКСПЕРТ) ===' as section;

SELECT 
    p.id as payment_id,
    p.plan_id,
    p.amount,
    u.id as user_id,
    u.email,
    u.name,
    u.user_type,
    p.created_at
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'succeeded' 
  AND p.plan_id IN ('monthly', 'yearly')
  AND u.user_type != 'expert';

-- 5. ИСПРАВЛЕНИЕ: Автоматически делаем экспертами всех, кто успешно оплатил monthly или yearly
-- Раскомментируйте следующий блок, если хотите автоматически исправить статусы:

/*
DO $$
DECLARE
    updated_count INTEGER := 0;
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT 
            u.id,
            u.email,
            u.name,
            p.plan_id
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'succeeded' 
          AND p.plan_id IN ('monthly', 'yearly')
          AND u.user_type != 'expert'
    LOOP
        -- Обновляем статус пользователя на эксперта
        UPDATE users 
        SET user_type = 'expert', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = user_record.id;
        
        -- Добавляем уведомление
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES (
            user_record.id,
            'payment_success',
            'Статус эксперта активирован',
            'Ваша подписка (' || user_record.plan_id || ') была успешно обработана. Вы теперь эксперт!',
            CURRENT_TIMESTAMP
        );
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Пользователь % (%) стал экспертом (план: %)', 
            user_record.email, user_record.id, user_record.plan_id;
    END LOOP;
    
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Обновлено пользователей: %', updated_count;
    RAISE NOTICE '=================================';
END $$;
*/

-- 6. Проверяем результат после исправления
SELECT 
    '=== РЕЗУЛЬТАТ ПОСЛЕ ИСПРАВЛЕНИЯ ===' as section;

SELECT 
    user_type,
    COUNT(*) as count
FROM users
GROUP BY user_type
ORDER BY user_type;

-- 7. Финальная проверка - все ли успешные monthly/yearly платежи дали статус эксперта
SELECT 
    '=== ФИНАЛЬНАЯ ПРОВЕРКА ===' as section;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ВСЕ УСПЕШНЫЕ MONTHLY/YEARLY ПЛАТЕЖИ ОБРАБОТАНЫ ПРАВИЛЬНО'
        ELSE '⚠️ ЕСТЬ НЕОБРАБОТАННЫЕ ПЛАТЕЖИ: ' || COUNT(*)::TEXT
    END as result
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'succeeded' 
  AND p.plan_id IN ('monthly', 'yearly')
  AND u.user_type != 'expert';

-- =============================================
-- ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ
-- =============================================
-- 
-- 1. Сначала запустите этот скрипт БЕЗ раскомментирования блока DO $$
--    чтобы увидеть текущую ситуацию
-- 
-- 2. Если есть проблемные платежи, раскомментируйте блок DO $$ (строки 61-97)
--    и запустите скрипт снова для автоматического исправления
-- 
-- 3. После исправления проверьте результат в разделе "ФИНАЛЬНАЯ ПРОВЕРКА"
-- 
-- =============================================

