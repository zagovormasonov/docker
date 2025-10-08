-- Создание таблиц для избранных экспертов и событий
-- Выполните этот скрипт в базе данных synergy_db

-- Таблица избранных экспертов
CREATE TABLE IF NOT EXISTS expert_favorites (
    id SERIAL PRIMARY KEY,
    expert_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expert_id, user_id)
);

-- Таблица избранных событий
CREATE TABLE IF NOT EXISTS event_favorites (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_expert_favorites_user_id ON expert_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_favorites_expert_id ON expert_favorites(expert_id);
CREATE INDEX IF NOT EXISTS idx_event_favorites_user_id ON event_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_favorites_event_id ON event_favorites(event_id);

-- Проверка создания таблиц
SELECT 'expert_favorites' as table_name, COUNT(*) as row_count FROM expert_favorites
UNION ALL
SELECT 'event_favorites' as table_name, COUNT(*) as row_count FROM event_favorites;
