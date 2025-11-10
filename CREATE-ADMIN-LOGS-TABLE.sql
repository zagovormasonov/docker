-- Создание таблицы для логирования административных действий
-- Выполните этот SQL в базе данных

-- Создаём таблицу логов
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  admin_name VARCHAR(255) NOT NULL, -- Сохраняем имя на случай удаления пользователя
  action_type VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'delete', 'update', 'create'
  entity_type VARCHAR(50) NOT NULL, -- 'article', 'event', 'user', 'comment', etc.
  entity_id INTEGER NOT NULL, -- ID сущности, над которой выполнено действие
  entity_title TEXT, -- Название статьи/события для удобства
  details JSONB, -- Дополнительные детали действия (причина отклонения и т.д.)
  ip_address VARCHAR(50), -- IP-адрес администратора
  user_agent TEXT, -- User agent браузера
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаём индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_type ON admin_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_id ON admin_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Комбинированный индекс для частых запросов
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_type_id ON admin_logs(entity_type, entity_id);

-- Добавляем комментарии к таблице и колонкам для документации
COMMENT ON TABLE admin_logs IS 'Логи всех административных действий в системе';
COMMENT ON COLUMN admin_logs.action_type IS 'Тип действия: approve, reject, delete, update, create, ban, unban';
COMMENT ON COLUMN admin_logs.entity_type IS 'Тип сущности: article, event, user, comment';
COMMENT ON COLUMN admin_logs.entity_id IS 'ID сущности, над которой выполнено действие';
COMMENT ON COLUMN admin_logs.details IS 'Дополнительные детали в формате JSON';

-- Проверяем создание
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_logs' 
ORDER BY ordinal_position;

