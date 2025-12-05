-- =============================================
-- РУЧНОЕ ИСПРАВЛЕНИЕ КОНКРЕТНОГО ПЛАТЕЖА
-- =============================================

-- ИНСТРУКЦИЯ:
-- 1. Запустите сначала СРОЧНАЯ-ДИАГНОСТИКА-ПЛАТЕЖА.sql
-- 2. Найдите ID платежа или email пользователя
-- 3. Замените в этом скрипте значения ниже
-- 4. Запустите этот скрипт

-- =============================================
-- НАСТРОЙКИ (ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ!)
-- =============================================

-- Вариант 1: Исправить по ID платежа
-- Раскомментируйте и укажите ID платежа из диагностики:
-- \set payment_id 123

-- Вариант 2: Исправить по email пользователя
-- Раскомментируйте и укажите email:
-- \set user_email 'user@example.com'

-- =============================================
-- АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ
-- =============================================

-- ВАРИАНТ 1: Исправить по ID платежа
-- Раскомментируйте этот блок и укажите payment_id выше
/*
DO $$
DECLARE
    v_payment_id INTEGER := 123; -- ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ID ПЛАТЕЖА!
    v_user_id INTEGER;
    v_user_email VARCHAR;
    v_plan_id VARCHAR;
    v_current_type VARCHAR;
BEGIN
    -- Получаем данные платежа
    SELECT p.user_id, u.email, p.plan_id, u.user_type
    INTO v_user_id, v_user_email, v_plan_id, v_current_type
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = v_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Платеж с ID % не найден!', v_payment_id;
    END IF;
    
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Платеж ID: %', v_payment_id;
    RAISE NOTICE 'Пользователь: % (ID: %)', v_user_email, v_user_id;
    RAISE NOTICE 'План: %', v_plan_id;
    RAISE NOTICE 'Текущий статус: %', v_current_type;
    RAISE NOTICE '=============================================';
    
    -- Проверяем, что это monthly или yearly
    IF v_plan_id NOT IN ('monthly', 'yearly') THEN
        RAISE NOTICE '⚠️ План % не дает статус эксперта автоматически', v_plan_id;
        RETURN;
    END IF;
    
    -- Проверяем, что пользователь еще не эксперт
    IF v_current_type = 'expert' THEN
        RAISE NOTICE '✅ Пользователь уже эксперт!';
        RETURN;
    END IF;
    
    -- Обновляем статус на эксперта
    UPDATE users 
    SET user_type = 'expert', 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = v_user_id;
    
    -- Добавляем уведомление
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
        v_user_id,
        'payment_success',
        'Статус эксперта активирован',
        'Ваша подписка (' || v_plan_id || ') была успешно обработана. Вы теперь эксперт!',
        CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✅ Пользователь % стал экспертом!', v_user_email;
    RAISE NOTICE '✅ Уведомление отправлено';
    RAISE NOTICE '=============================================';
END $$;
*/

-- ВАРИАНТ 2: Исправить по email пользователя
-- Раскомментируйте этот блок и укажите email ниже
/*
DO $$
DECLARE
    v_user_email VARCHAR := 'user@example.com'; -- ЗАМЕНИТЕ НА РЕАЛЬНЫЙ EMAIL!
    v_user_id INTEGER;
    v_payment_id INTEGER;
    v_plan_id VARCHAR;
    v_current_type VARCHAR;
    v_payment_status VARCHAR;
BEGIN
    -- Получаем последний успешный платеж пользователя
    SELECT u.id, u.user_type, p.id, p.plan_id, p.status
    INTO v_user_id, v_current_type, v_payment_id, v_plan_id, v_payment_status
    FROM users u
    LEFT JOIN payments p ON p.user_id = u.id
    WHERE u.email = v_user_email
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Пользователь с email % не найден!', v_user_email;
    END IF;
    
    IF v_payment_id IS NULL THEN
        RAISE EXCEPTION 'У пользователя % нет платежей!', v_user_email;
    END IF;
    
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Пользователь: % (ID: %)', v_user_email, v_user_id;
    RAISE NOTICE 'Последний платеж ID: %', v_payment_id;
    RAISE NOTICE 'План: %', v_plan_id;
    RAISE NOTICE 'Статус платежа: %', v_payment_status;
    RAISE NOTICE 'Текущий статус пользователя: %', v_current_type;
    RAISE NOTICE '=============================================';
    
    -- Проверяем статус платежа
    IF v_payment_status != 'succeeded' THEN
        RAISE NOTICE '⚠️ Платеж не в статусе succeeded (текущий: %)', v_payment_status;
        RAISE NOTICE 'Нужно сначала подтвердить платеж в Юкассе';
        RETURN;
    END IF;
    
    -- Проверяем, что это monthly или yearly
    IF v_plan_id NOT IN ('monthly', 'yearly') THEN
        RAISE NOTICE '⚠️ План % не дает статус эксперта автоматически', v_plan_id;
        RETURN;
    END IF;
    
    -- Проверяем, что пользователь еще не эксперт
    IF v_current_type = 'expert' THEN
        RAISE NOTICE '✅ Пользователь уже эксперт!';
        RETURN;
    END IF;
    
    -- Обновляем статус на эксперта
    UPDATE users 
    SET user_type = 'expert', 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = v_user_id;
    
    -- Добавляем уведомление
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
        v_user_id,
        'payment_success',
        'Статус эксперта активирован',
        'Ваша подписка (' || v_plan_id || ') была успешно обработана. Вы теперь эксперт!',
        CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✅ Пользователь % стал экспертом!', v_user_email;
    RAISE NOTICE '✅ Уведомление отправлено';
    RAISE NOTICE '=============================================';
END $$;
*/

-- ПРОВЕРКА РЕЗУЛЬТАТА
-- Раскомментируйте нужный вариант после исправления:

-- По ID платежа:
-- SELECT u.email, u.user_type FROM users u JOIN payments p ON p.user_id = u.id WHERE p.id = 123;

-- По email:
-- SELECT email, user_type FROM users WHERE email = 'user@example.com';




