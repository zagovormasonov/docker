import { Pool } from 'pg';
import dotenv from 'dotenv';
import { RUSSIAN_CITIES } from './cities';

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

    // Таблица готовых продуктов
    await query(`
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
    await query(`CREATE INDEX IF NOT EXISTS idx_products_expert_id ON products(expert_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type)`);

    // Добавляем новые поля и таблицы (миграции)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_url VARCHAR(500)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(500)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_types TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(500)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(500)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`);

    // Таблица городов
    await query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    // Таблица отзывов
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица лайков статей
    await query(`
      CREATE TABLE IF NOT EXISTS article_likes (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(article_id, user_id)
      )
    `);

    // Таблица избранных статей
    await query(`
      CREATE TABLE IF NOT EXISTS article_favorites (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(article_id, user_id)
      )
    `);

    // Добавляем счетчик лайков к статьям
    await query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0`);

    // Таблица событий (новая версия для мероприятий)
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image TEXT,
        event_type VARCHAR(100) NOT NULL,
        is_online BOOLEAN DEFAULT false,
        city_id INTEGER REFERENCES cities(id),
        event_date TIMESTAMP NOT NULL,
        location TEXT,
        price VARCHAR(100),
        registration_link TEXT,
        organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Миграция: добавляем новые колонки если таблица уже существует со старой структурой
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id)`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS price VARCHAR(100)`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_link TEXT`);
    await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE`);
    
    // Поля для модерации событий (только если их нет)
    try {
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false`);
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending'`);
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_reason TEXT`);
      await query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP`);
      console.log('✅ Поля модерации событий добавлены');
    } catch (error) {
      console.log('⚠️ Поля модерации событий уже существуют или ошибка:', error.message);
    }
    
    // Переименовываем старые колонки если они есть
    try {
      await query(`ALTER TABLE events DROP COLUMN IF EXISTS author_id`);
      await query(`ALTER TABLE events DROP COLUMN IF EXISTS content`);
      await query(`ALTER TABLE events DROP COLUMN IF EXISTS city`);
      await query(`ALTER TABLE events DROP COLUMN IF EXISTS views`);
      console.log('✅ Старые колонки удалены');
    } catch (error) {
      console.log('⚠️ Ошибка удаления старых колонок:', error.message);
    }

    // Таблица кастомных соцсетей
    await query(`
      CREATE TABLE IF NOT EXISTS custom_socials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Индексы
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_expert ON reviews(expert_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_events_city ON events(city_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_article_likes_article ON article_likes(article_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_article_favorites_user ON article_favorites(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_custom_socials_user ON custom_socials(user_id)`);

    // Вставляем тематики (убраны дублирующиеся: Гвоздестояние, Кинезиология, Хьюман дизайн, Тантра, Расстановки)
    const topics = [
      'Авторская техника', 'Ароматерапия', 'Арт-терапия', 'Астрология', 'Аюрведа',
      'Автор - художник', 'Автор - писатель', 'Автор - музыкант',
      'Биоэнергетика', 'Васту Шастра', 'Гештальт-терапия', 'Гипнотерапия',
      'Дыхание: Нирхарана, Холотропное и др', 'Женские практики', 'Звукотерапия', 'Йога', 'Каббала',
      'Карты Ленорман', 'Квантовая психология', 'Космоэнергетика', 'МАК карты',
      'Мандалы', 'Массаж, Краниосакральная Терапия', 'Матрица Судьбы', 'Медитация', 'Нейрографика',
      'Нумерология', 'Нутрициология', 'Остеопатия', 'Парапсихология', 'Психология, психосоматика',
      'Регрессивная терапия', 'Рефлексология', 'Рейки', 'Руны',
      'Сакральная Геометрия', 'Славянские практики', 'Соматические практики', 'Суфизм', 'Тайцзицюань',
      'Таро', 'Телесно-ориентированная терапия', 'Тетахилинг', 'Трансперсональная Психология',
      'Традиционная Китайская Медицина', 'Фэн-шуй', 'Хиромантия', 'Хроники Акаши',
      'Целительство', 'Ченнелинг', 'Шаманизм', 'Энергомассаж, энерговолны', 'Эннеаграмма',
      'Цигун', 'Цолькин', 'Литотерапия'
    ];

    for (const topic of topics) {
      await query(
        `INSERT INTO topics (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [topic]
      );
    }

    // Таблица расписания экспертов по дням недели
    await query(`
      CREATE TABLE IF NOT EXISTS expert_schedule (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration INTEGER DEFAULT 60,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(expert_id, day_of_week, start_time, end_time)
      )
    `);
    
    // Оставляем старую таблицу для совместимости
    await query(`
      CREATE TABLE IF NOT EXISTS expert_availability (
        id SERIAL PRIMARY KEY,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        is_booked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(expert_id, date, time_slot)
      )
    `);

    // Таблица бронирований
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        availability_id INTEGER REFERENCES expert_availability(id) ON DELETE CASCADE,
        expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')) DEFAULT 'pending',
        client_message TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Индексы для оптимизации бронирований
    await query(`CREATE INDEX IF NOT EXISTS idx_expert_schedule_expert ON expert_schedule(expert_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expert_schedule_day ON expert_schedule(day_of_week)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expert_availability_expert ON expert_availability(expert_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expert_availability_date ON expert_availability(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_expert ON bookings(expert_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`);

    // Вставляем города России
    for (const city of RUSSIAN_CITIES) {
      await query(
        `INSERT INTO cities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [city]
      );
    }

    console.log('✅ База данных инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
};

export default pool;