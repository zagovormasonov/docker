const { Pool } = require('pg');

// Подключение к базе данных
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'synergy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function checkAndCreateProductsTable() {
  try {
    console.log('🔍 Проверяем существование таблицы products...');
    
    // Проверяем, существует ли таблица
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    console.log('📊 Таблица products существует:', tableExists);
    
    if (!tableExists) {
      console.log('🔨 Создаем таблицу products...');
      
      // Создаем таблицу
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
        );
      `);
      
      // Создаем индексы
      await pool.query('CREATE INDEX IF NOT EXISTS idx_products_expert_id ON products(expert_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);');
      
      console.log('✅ Таблица products создана успешно!');
    } else {
      console.log('✅ Таблица products уже существует');
    }
    
    // Проверяем структуру таблицы
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Структура таблицы products:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndCreateProductsTable();
