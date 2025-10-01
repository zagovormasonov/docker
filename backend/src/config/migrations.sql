-- Миграция: добавление новых функций

-- 1. Добавляем поля для соцсетей в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS consultation_types TEXT; -- JSON array

-- 2. Таблица городов
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

-- 3. Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица событий/мероприятий
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  cover_image VARCHAR(500),
  city VARCHAR(255),
  event_type VARCHAR(100), -- онлайн/оффлайн/смешанный
  event_date TIMESTAMP,
  is_published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица лайков статей
CREATE TABLE IF NOT EXISTS article_likes (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- 6. Таблица избранных статей
CREATE TABLE IF NOT EXISTS article_favorites (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- 7. Добавляем счетчик лайков к статьям
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 8. Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_reviews_expert ON reviews(expert_id);
CREATE INDEX IF NOT EXISTS idx_events_author ON events(author_id);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_article_likes_article ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_favorites_user ON article_favorites(user_id);

