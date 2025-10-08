const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://synergy:synergy123@localhost:5432/synergy_db'
});

async function testConnection() {
  try {
    console.log('🔌 Тестирование подключения к базе данных...');
    const client = await pool.connect();
    
    // Проверяем существование таблиц
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('expert_favorites', 'event_favorites', 'users', 'events')
      ORDER BY table_name;
    `);
    
    console.log('📋 Найденные таблицы:', result.rows.map(row => row.table_name));
    
    if (result.rows.length < 2) {
      console.log('❌ Таблицы users или events не найдены');
    }
    
    if (!result.rows.find(row => row.table_name === 'expert_favorites')) {
      console.log('⚠️  Таблица expert_favorites не найдена - нужно создать');
    }
    
    if (!result.rows.find(row => row.table_name === 'event_favorites')) {
      console.log('⚠️  Таблица event_favorites не найдена - нужно создать');
    }
    
    client.release();
    console.log('✅ Подключение к базе данных работает');
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
