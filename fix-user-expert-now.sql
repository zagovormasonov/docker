-- =============================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ: Сделать пользователя экспертом
-- =============================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Замените 'user@example.com' на реальный email пользователя
-- 2. Запустите этот скрипт
-- 3. Готово!
-- 
-- =============================================

-- ЗАМЕНИТЕ EMAIL НИЖЕ!
\set user_email 'karflawed@gmail.com'

DO $$
DECLARE
    v_user_email VARCHAR := 'karflawed@gmail.com'; -- ⬅️ ЗАМЕНИТЕ НА РЕАЛЬНЫЙ EMAIL!
    v_user_id INTEGER;
    v_current_type VARCHAR;
    v_payment_id INTEGER;
    v_plan_id VARCHAR;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '🔧 ИСПРАВЛЕНИЕ СТАТУСА ЭКСПЕРТА';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '';
    
    -- Проверяем, существует ли пользователь
    SELECT id, user_type INTO v_user_id, v_current_type
    FROM users 
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Пользователь с email % не найден!', v_user_email;
    END IF;
    
    RAISE NOTICE '✅ Пользователь найден:';
    RAISE NOTICE '   Email: %', v_user_email;
    RAISE NOTICE '   ID: %', v_user_id;
    RAISE NOTICE '   Текущий статус: %', v_current_type;
    RAISE NOTICE '';
    
    -- Проверяем последний платеж
    SELECT p.id, p.plan_id INTO v_payment_id, v_plan_id
    FROM payments p
    WHERE p.user_id = v_user_id
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    IF v_payment_id IS NOT NULL THEN
        RAISE NOTICE '💳 Последний платеж:';
        RAISE NOTICE '   ID платежа: %', v_payment_id;
        RAISE NOTICE '   План: %', v_plan_id;
        RAISE NOTICE '';
    END IF;
    
    -- Проверяем, уже эксперт?
    IF v_current_type = 'expert' THEN
        RAISE NOTICE '✅ Пользователь уже является экспертом!';
        RAISE NOTICE '';
        RAISE NOTICE '=============================================';
        RETURN;
    END IF;
    
    -- Обновляем статус на эксперта
    RAISE NOTICE '🔄 Обновляем статус на "эксперт"...';
    
    UPDATE users 
    SET user_type = 'expert', 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Статус обновлен!';
    RAISE NOTICE '';
    
    -- Добавляем уведомление
    RAISE NOTICE '📧 Отправляем уведомление...';
    
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
        v_user_id,
        'payment_success',
        'Статус эксперта активирован',
        'Поздравляем! Теперь вы эксперт и можете использовать все функции платформы.',
        CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✅ Уведомление отправлено!';
    RAISE NOTICE '';
    
    RAISE NOTICE '=============================================';
    RAISE NOTICE '✅ ГОТОВО! Пользователь % теперь эксперт!', v_user_email;
    RAISE NOTICE '=============================================';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ ОШИБКА: %', SQLERRM;
        RAISE NOTICE '';
        RAISE;
END $$;

-- Проверка результата
SELECT 
    '=== РЕЗУЛЬТАТ ===' as section;

SELECT 
    email,
    user_type as статус,
    updated_at as обновлено
FROM users 
WHERE email = 'karflawed@gmail.com'; -- ⬅️ ЗАМЕНИТЕ НА ТОТ ЖЕ EMAIL!

