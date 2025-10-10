-- Проверка существования таблицы profile_gallery
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'profile_gallery'
);

-- Если таблица не существует, создаем её
CREATE TABLE IF NOT EXISTS profile_gallery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_name VARCHAR(255),
  image_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_profile_gallery_user ON profile_gallery(user_id);

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profile_gallery' 
ORDER BY ordinal_position;

-- Проверяем, есть ли данные в таблице
SELECT COUNT(*) as total_entries FROM profile_gallery;
