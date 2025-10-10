-- Создание таблицы для галереи фотографий профиля
CREATE TABLE IF NOT EXISTS profile_gallery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_name VARCHAR(255),
  image_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_profile_gallery_user ON profile_gallery(user_id);

-- Ограничение на количество фотографий (20 максимум)
-- Это будет проверяться в приложении, так как PostgreSQL не поддерживает ограничения на количество записей напрямую

-- Проверяем результат
SELECT COUNT(*) as total_gallery_entries FROM profile_gallery;
SELECT * FROM profile_gallery ORDER BY created_at DESC;
