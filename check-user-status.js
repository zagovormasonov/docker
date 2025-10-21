const { Pool } = require('pg');

// Подключение к базе данных
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'synergy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function checkUserStatus() {
  try {
    console.log('🔍 Проверяем пользователей в системе...');
    
    // Получаем всех пользователей
    const users = await pool.query(`
      SELECT id, email, name, user_type, email_verified, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    
    console.log('👥 Последние 10 пользователей:');
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Type: ${user.user_type}, Verified: ${user.email_verified}`);
    });
    
    // Проверяем экспертов
    const experts = await pool.query(`
      SELECT id, email, name, user_type 
      FROM users 
      WHERE user_type = 'expert';
    `);
    
    console.log(`\n🎯 Найдено экспертов: ${experts.rows.length}`);
    experts.rows.forEach((expert, index) => {
      console.log(`${index + 1}. ID: ${expert.id}, Email: ${expert.email}, Name: ${expert.name}`);
    });
    
    // Проверяем продукты
    const products = await pool.query(`
      SELECT COUNT(*) as count FROM products;
    `);
    
    console.log(`\n📦 Всего продуктов в системе: ${products.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserStatus();
