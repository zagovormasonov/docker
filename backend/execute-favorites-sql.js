const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/soulsynergy'
});

async function createFavoritesTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Создание таблиц для избранных экспертов и событий...');
    
    // Создание таблицы избранных экспертов
    await client.query(`
      CREATE TABLE IF NOT EXISTS expert_favorites (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(expert_id, user_id)
      );
    `);
    console.log('✅ Таблица expert_favorites создана');

    // Создание таблицы избранных событий
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_favorites (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      );
    `);
    console.log('✅ Таблица event_favorites создана');

    // Создание индексов
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expert_favorites_user_id ON expert_favorites(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expert_favorites_expert_id ON expert_favorites(expert_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_event_favorites_user_id ON event_favorites(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_event_favorites_event_id ON event_favorites(event_id);
    `);
    console.log('✅ Индексы созданы');

    console.log('🎉 Все таблицы для избранного успешно созданы!');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createFavoritesTables();
