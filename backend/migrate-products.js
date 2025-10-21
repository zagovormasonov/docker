const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('twc1.net') || 
       process.env.DATABASE_URL?.includes('elephantsql') ||
       process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function migrateProducts() {
  try {
    console.log('🔄 Создание таблицы products...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2),
        product_type VARCHAR(50) CHECK (product_type IN ('digital', 'physical', 'service')),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔄 Создание индексов...');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_expert_id ON products(expert_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type)`);

    console.log('✅ Миграция продуктов завершена успешно!');
    
    // Проверим, что таблица создана
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    
    console.log('📋 Структура таблицы products:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  } finally {
    await pool.end();
  }
}

migrateProducts();
