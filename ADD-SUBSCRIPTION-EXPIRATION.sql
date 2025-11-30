-- =============================================
-- ДОБАВЛЕНИЕ АВТОМАТИЧЕСКОГО ИСТЕЧЕНИЯ ПОДПИСКИ
-- =============================================
-- 
-- Эта миграция добавляет поля для отслеживания срока действия подписки
-- и автоматического снятия статуса эксперта после окончания подписки
-- 
-- =============================================

-- 1. Добавляем поля для отслеживания подписки в таблицу users
DO $$
BEGIN
    -- Добавляем поле subscription_expires_at (дата окончания подписки)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;
        RAISE NOTICE '✅ Добавлено поле subscription_expires_at в таблицу users';
    ELSE
        RAISE NOTICE 'ℹ️  Поле subscription_expires_at уже существует';
    END IF;

    -- Добавляем поле subscription_plan (тип подписки: monthly, yearly)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50);
        RAISE NOTICE '✅ Добавлено поле subscription_plan в таблицу users';
    ELSE
        RAISE NOTICE 'ℹ️  Поле subscription_plan уже существует';
    END IF;

    -- Добавляем поле last_payment_date (дата последнего платежа)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_payment_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_payment_date TIMESTAMP;
        RAISE NOTICE '✅ Добавлено поле last_payment_date в таблицу users';
    ELSE
        RAISE NOTICE 'ℹ️  Поле last_payment_date уже существует';
    END IF;
END $$;

-- 2. Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires_at ON users(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- 3. Добавляем комментарии
COMMENT ON COLUMN users.subscription_expires_at IS 'Дата окончания подписки эксперта';
COMMENT ON COLUMN users.subscription_plan IS 'Тип подписки: monthly (месячная) или yearly (годовая)';
COMMENT ON COLUMN users.last_payment_date IS 'Дата последнего успешного платежа';

-- 4. Обновляем существующих экспертов (устанавливаем срок на год вперед)
UPDATE users 
SET subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 year',
    subscription_plan = 'yearly',
    last_payment_date = CURRENT_TIMESTAMP
WHERE user_type = 'expert' 
  AND subscription_expires_at IS NULL;

-- 5. Создаем функцию для автоматической проверки истечения подписок
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE(
    user_id INTEGER,
    email VARCHAR,
    username VARCHAR,
    expired_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.username,
        u.subscription_expires_at
    FROM users u
    WHERE u.user_type = 'expert'
      AND u.subscription_expires_at IS NOT NULL
      AND u.subscription_expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 6. Создаем функцию для снятия статуса эксперта у пользователей с истекшей подпиской
CREATE OR REPLACE FUNCTION revoke_expired_subscriptions()
RETURNS TABLE(
    revoked_count INTEGER
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Снимаем статус эксперта у пользователей с истекшей подпиской
    UPDATE users 
    SET user_type = 'client',
        updated_at = CURRENT_TIMESTAMP
    WHERE user_type = 'expert'
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Отправляем уведомления пользователям
    INSERT INTO notifications (user_id, type, title, message, created_at)
    SELECT 
        u.id,
        'subscription_expired',
        'Подписка истекла',
        CASE 
            WHEN u.subscription_plan = 'monthly' THEN 'Ваша месячная подписка истекла. Для продолжения работы эксперта, пожалуйста, продлите подписку.'
            WHEN u.subscription_plan = 'yearly' THEN 'Ваша годовая подписка истекла. Для продолжения работы эксперта, пожалуйста, продлите подписку.'
            ELSE 'Ваша подписка истекла. Для продолжения работы эксперта, пожалуйста, продлите подписку.'
        END,
        CURRENT_TIMESTAMP
    FROM users u
    WHERE u.user_type = 'client'
      AND u.subscription_expires_at IS NOT NULL
      AND u.subscription_expires_at < CURRENT_TIMESTAMP
      AND u.updated_at > CURRENT_TIMESTAMP - INTERVAL '1 minute'; -- только что обновленные
    
    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Проверяем результат
SELECT 
    '=== ТЕКУЩИЕ ЭКСПЕРТЫ ===' as section;

SELECT 
    id,
    email,
    username,
    user_type,
    subscription_plan as "план_подписки",
    subscription_expires_at as "истекает",
    CASE 
        WHEN subscription_expires_at IS NULL THEN 'Не установлен срок'
        WHEN subscription_expires_at > CURRENT_TIMESTAMP THEN 'Активна'
        ELSE 'Истекла'
    END as "статус_подписки"
FROM users 
WHERE user_type = 'expert'
ORDER BY subscription_expires_at ASC NULLS LAST
LIMIT 20;

-- 8. Информация об использовании
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Добавлены поля:';
    RAISE NOTICE '   - subscription_expires_at (дата окончания)';
    RAISE NOTICE '   - subscription_plan (тип подписки)';
    RAISE NOTICE '   - last_payment_date (дата последнего платежа)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Созданные функции:';
    RAISE NOTICE '   - check_expired_subscriptions() - проверка истекших подписок';
    RAISE NOTICE '   - revoke_expired_subscriptions() - снятие статуса с истекших подписок';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Примеры использования:';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Проверить истекшие подписки:';
    RAISE NOTICE '   SELECT * FROM check_expired_subscriptions();';
    RAISE NOTICE '';
    RAISE NOTICE '   -- Автоматически снять статус с истекших:';
    RAISE NOTICE '   SELECT * FROM revoke_expired_subscriptions();';
    RAISE NOTICE '';
    RAISE NOTICE '=============================================';
END $$;

