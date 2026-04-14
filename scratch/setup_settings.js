const { query } = require('./backend/src/config/database');

async function setupSettings() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS global_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await query(`
      INSERT INTO global_settings (key, value) 
      VALUES ('auto_moderation_events', '{"enabled": false}')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('✅ Таблица настроек создана и инициализирована');
  } catch (error) {
    console.error('❌ Ошибка настройки:', error);
  }
}

setupSettings();
