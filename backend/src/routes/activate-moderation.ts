import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// Endpoint для активации системы модерации
router.get('/', async (req, res) => {
  try {
    console.log('Активация системы модерации...');
    
    // 1. Добавляем поля модерации в articles
    await query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
      ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP
    `);
    console.log('Поля модерации добавлены в articles');
    
    // 2. Добавляем поля модерации в events
    await query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
      ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP
    `);
    console.log('Поля модерации добавлены в events');
    
    // 3. Создаем таблицу уведомлений
    await query(`
      CREATE TABLE IF NOT EXISTS moderation_notifications (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(20) NOT NULL,
        content_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL REFERENCES users(id),
        admin_id INTEGER NOT NULL REFERENCES users(id),
        chat_id INTEGER NOT NULL REFERENCES chats(id),
        status VARCHAR(20) DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `);
    console.log('Таблица уведомлений создана');
    
    // 4. Создаем индексы
    await query('CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status)');
    await query('CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status)');
    await query('CREATE INDEX IF NOT EXISTS idx_moderation_notifications_status ON moderation_notifications(status)');
    console.log('Индексы созданы');
    
    // 5. Обновляем существующие записи
    await query("UPDATE articles SET moderation_status = 'approved' WHERE moderation_status IS NULL");
    await query("UPDATE events SET moderation_status = 'approved' WHERE moderation_status IS NULL");
    console.log('Существующие записи обновлены');
    
    res.json({
      success: true,
      message: 'Система модерации активирована!',
      details: [
        'Поля модерации добавлены в articles и events',
        'Таблица уведомлений создана',
        'Индексы созданы',
        'Существующие записи помечены как одобренные'
      ]
    });
    
  } catch (error) {
    console.error('Ошибка активации модерации:', error);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка активации системы модерации',
      details: error.message 
    });
  }
});

export default router;
