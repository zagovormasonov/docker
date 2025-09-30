import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Определяем нужен ли SSL (для облачных БД)
const isProduction = process.env.DATABASE_URL?.includes('twc1.net') || 
                     process.env.DATABASE_URL?.includes('elephantsql') ||
                     process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDatabase = async () => {
  try {
    // Таблица пользователей
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('client', 'expert')),
        avatar_url VARCHAR(500),
        bio TEXT,
        city VARCHAR(255),
        is_online BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица тематик
    await query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    // Таблица связи экспертов с тематиками
    await query(`
      CREATE TABLE IF NOT EXISTS expert_topics (
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        PRIMARY KEY (expert_id, topic_id)
      )
    `);

    // Таблица услуг
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2),
        duration INTEGER,
        service_type VARCHAR(50) CHECK (service_type IN ('online', 'offline', 'both')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица статей
    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        cover_image VARCHAR(500),
        is_published BOOLEAN DEFAULT true,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица чатов
    await query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )
    `);

    // Таблица сообщений
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Индексы для оптимизации
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expert_topics_expert ON expert_topics(expert_id)`);

    // Вставляем тематики
    const topics = [
      'Регресс', 'Парапсихология', 'Расстановки', 'Хьюман дизайн', 'МАК карты',
      'Таро', 'Руны', 'Карты Ленорман', 'Астрология', 'Нумерология',
      'Тетахилинг', 'Космоэнергетика', 'Рейки', 'Шаманизм', 'Славянские практики',
      'Звукотерапия', 'Целительство', 'Женские практики', 'Йога', 'Гвоздестояние',
      'Тантра практики', 'Нутрициология', 'Ароматерапия', 'Квантовая психология',
      'Медитация', 'Нейрографика', 'Мандалы', 'Литотерапия', 'Кинезиология'
    ];

    for (const topic of topics) {
      await query(
        `INSERT INTO topics (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [topic]
      );
    }

    console.log('✅ База данных инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
};

export default pool;
