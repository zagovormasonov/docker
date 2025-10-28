-- Проверка и исправление таблицы платежей для автоматического подтверждения

-- 1. Проверяем существование таблицы payments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE NOTICE 'Создаем таблицу payments...';
        
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_id VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
            yookassa_payment_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Создаем индексы для оптимизации запросов
        CREATE INDEX idx_payments_user_id ON payments(user_id);
        CREATE INDEX idx_payments_status ON payments(status);
        CREATE INDEX idx_payments_yookassa_id ON payments(yookassa_payment_id);
        
        RAISE NOTICE 'Таблица payments создана успешно!';
    ELSE
        RAISE NOTICE 'Таблица payments уже существует.';
    END IF;
END $$;

-- 2. Проверяем существование таблицы notifications (для уведомлений)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE 'Создаем таблицу notifications...';
        
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Создаем индексы
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_is_read ON notifications(is_read);
        
        RAISE NOTICE 'Таблица notifications создана успешно!';
    ELSE
        RAISE NOTICE 'Таблица notifications уже существует.';
    END IF;
END $$;

-- 3. Проверяем колонки в таблице payments
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Проверяем наличие всех необходимых колонок
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'yookassa_payment_id') THEN
        missing_columns := array_append(missing_columns, 'yookassa_payment_id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        missing_columns := array_append(missing_columns, 'updated_at');
    END IF;
    
    -- Добавляем недостающие колонки
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Добавляем недостающие колонки: %', array_to_string(missing_columns, ', ');
        
        IF 'yookassa_payment_id' = ANY(missing_columns) THEN
            ALTER TABLE payments ADD COLUMN yookassa_payment_id VARCHAR(255);
            CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
        END IF;
        
        IF 'updated_at' = ANY(missing_columns) THEN
            ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        RAISE NOTICE 'Колонки добавлены успешно!';
    ELSE
        RAISE NOTICE 'Все необходимые колонки присутствуют.';
    END IF;
END $$;

-- 4. Проверяем статусы платежей
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as first_payment,
    MAX(created_at) as last_payment
FROM payments 
GROUP BY status 
ORDER BY status;

-- 5. Проверяем пользователей-экспертов
SELECT 
    user_type,
    COUNT(*) as count
FROM users 
GROUP BY user_type 
ORDER BY user_type;

-- 6. Проверяем связь платежей и пользователей
SELECT 
    p.id as payment_id,
    p.status,
    p.amount,
    p.yookassa_payment_id,
    u.email,
    u.user_type,
    p.created_at
FROM payments p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 7. Проверяем необработанные платежи
SELECT 
    p.id as payment_id,
    p.status,
    p.amount,
    p.yookassa_payment_id,
    u.email,
    u.user_type,
    p.created_at,
    CASE 
        WHEN p.status = 'succeeded' AND u.user_type != 'expert' THEN 'ТРЕБУЕТ ВНИМАНИЯ'
        WHEN p.status = 'pending' AND p.created_at < NOW() - INTERVAL '1 hour' THEN 'ДОЛГО ОЖИДАЕТ'
        ELSE 'OK'
    END as status_check
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.status IN ('pending', 'succeeded')
ORDER BY p.created_at DESC;

-- 8. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Финальная проверка
DO $$
DECLARE
    payments_count INTEGER;
    notifications_count INTEGER;
    users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO payments_count FROM payments;
    SELECT COUNT(*) INTO notifications_count FROM notifications;
    SELECT COUNT(*) INTO users_count FROM users;
    
    RAISE NOTICE '=== ИТОГОВАЯ СТАТИСТИКА ===';
    RAISE NOTICE 'Платежей в системе: %', payments_count;
    RAISE NOTICE 'Уведомлений в системе: %', notifications_count;
    RAISE NOTICE 'Пользователей в системе: %', users_count;
    RAISE NOTICE '========================';
END $$;
