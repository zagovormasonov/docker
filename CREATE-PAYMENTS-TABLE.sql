-- Создание таблицы для хранения информации о платежах
CREATE TABLE IF NOT EXISTS payments (
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

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);

-- Комментарии к таблице и полям
COMMENT ON TABLE payments IS 'Таблица для хранения информации о платежах за подписку эксперта';
COMMENT ON COLUMN payments.user_id IS 'ID пользователя, совершившего платеж';
COMMENT ON COLUMN payments.plan_id IS 'ID тарифного плана (free, yearly, lifetime)';
COMMENT ON COLUMN payments.amount IS 'Сумма платежа в рублях';
COMMENT ON COLUMN payments.description IS 'Описание платежа';
COMMENT ON COLUMN payments.status IS 'Статус платежа: pending, succeeded, failed, canceled';
COMMENT ON COLUMN payments.yookassa_payment_id IS 'ID платежа в системе Юкассы';
COMMENT ON COLUMN payments.created_at IS 'Дата создания записи';
COMMENT ON COLUMN payments.updated_at IS 'Дата последнего обновления записи';