-- Активация полной системы модерации
-- Выполните этот SQL в базе данных

-- 1. Добавляем поля модерации в таблицу articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- 2. Добавляем поля модерации в таблицу events  
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- 3. Создаем таблицу для уведомлений модерации
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

-- 4. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_status ON moderation_notifications(status);

-- 5. Обновляем существующие статьи - делаем их одобренными
UPDATE articles SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- 6. Обновляем существующие события - делаем их одобренными  
UPDATE events SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- 7. Проверяем результат
SELECT 'Articles with moderation fields:' as info;
SELECT id, title, moderation_status FROM articles LIMIT 5;

SELECT 'Events with moderation fields:' as info;
SELECT id, title, moderation_status FROM events LIMIT 5;
