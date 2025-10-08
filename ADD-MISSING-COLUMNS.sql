-- Добавление недостающих колонок без удаления данных

-- 1. Добавляем колонки в таблицу articles (если их нет)
DO $$
BEGIN
    -- Добавляем author_id если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'author_id') THEN
        ALTER TABLE articles ADD COLUMN author_id INTEGER;
        -- Устанавливаем author_id = 1 для всех существующих записей
        UPDATE articles SET author_id = 1 WHERE author_id IS NULL;
        ALTER TABLE articles ALTER COLUMN author_id SET NOT NULL;
        ALTER TABLE articles ADD CONSTRAINT fk_articles_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Добавляем is_published если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'is_published') THEN
        ALTER TABLE articles ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Добавляем created_at если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'created_at') THEN
        ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Добавляем updated_at если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'updated_at') THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 2. Добавляем колонки в таблицу events (если их нет)
DO $$
BEGIN
    -- Добавляем author_id если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'author_id') THEN
        ALTER TABLE events ADD COLUMN author_id INTEGER;
        -- Устанавливаем author_id = 1 для всех существующих записей
        UPDATE events SET author_id = 1 WHERE author_id IS NULL;
        ALTER TABLE events ALTER COLUMN author_id SET NOT NULL;
        ALTER TABLE events ADD CONSTRAINT fk_events_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Добавляем is_published если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
        ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Добавляем created_at если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'created_at') THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Добавляем updated_at если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'updated_at') THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Создаем таблицу notifications если её нет
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_events_author_id ON events(author_id);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 5. Проверяем результат
SELECT 
    'articles' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position

UNION ALL

SELECT 
    'events' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY table_name, ordinal_position;
