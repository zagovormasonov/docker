-- Настройка системы модерации
-- Выполните эти SQL запросы в базе данных

-- Добавляем поля модерации в таблицу articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Добавляем поля модерации в таблицу events  
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Создаем таблицу для уведомлений модерации
CREATE TABLE IF NOT EXISTS moderation_notifications (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL, -- 'article' или 'event'
  content_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_status ON moderation_notifications(status);

-- Проверяем структуру таблиц
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' AND column_name LIKE 'moderation%'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name LIKE 'moderation%'
ORDER BY ordinal_position;
