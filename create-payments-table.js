const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createPaymentsTable() {
  try {
    console.log('Подключение к базе данных...');
    
    // Проверяем, существует ли таблица
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Таблица payments уже существует');
      return;
    }
    
    console.log('Создание таблицы payments...');
    
    // Создаем таблицу
    await pool.query(`
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
    `);
    
    // Создаем индексы
    await pool.query(`
      CREATE INDEX idx_payments_user_id ON payments(user_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_yookassa_id ON payments(yookassa_payment_id);
    `);
    
    console.log('✅ Таблица payments успешно создана');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблицы:', error.message);
  } finally {
    await pool.end();
  }
}

createPaymentsTable();
