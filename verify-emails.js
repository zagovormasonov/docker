const { Pool } = require('pg');

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://synergy:synergy123@localhost:5432/synergy_db'
});

async function verifyEmails() {
  try {
    console.log('🔍 Подключаемся к базе данных...');
    
    // Проверяем текущий статус пользователей
    const checkResult = await pool.query(
      "SELECT id, name, email, email_verified FROM users WHERE email IN ($1, $2)",
      ['trufelleg@gmail.com', 'gr-light369@yandex.ru']
    );
    
    console.log('📊 Текущий статус пользователей:');
    checkResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): verified = ${user.email_verified}`);
    });
    
    // Обновляем статус верификации
    const updateResult = await pool.query(
      "UPDATE users SET email_verified = true WHERE email IN ($1, $2)",
      ['trufelleg@gmail.com', 'gr-light369@yandex.ru']
    );
    
    console.log(`✅ Обновлено ${updateResult.rowCount} пользователей`);
    
    // Проверяем результат
    const verifyResult = await pool.query(
      "SELECT id, name, email, email_verified FROM users WHERE email IN ($1, $2)",
      ['trufelleg@gmail.com', 'gr-light369@yandex.ru']
    );
    
    console.log('📊 Обновленный статус пользователей:');
    verifyResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): verified = ${user.email_verified}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

verifyEmails();

