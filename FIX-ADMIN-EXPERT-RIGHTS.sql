-- =============================================
-- Исправление прав администратора для создания событий и статей
-- =============================================

-- 1. Проверим текущий тип пользователя (замените email на свой)
SELECT id, name, email, user_type, created_at
FROM users
WHERE email = 'ваш_email@example.com';
-- Убедитесь, что user_type = 'admin'

-- 2. Проверим, сколько у нас администраторов
SELECT COUNT(*) as admin_count
FROM users
WHERE user_type = 'admin';

-- 3. Посмотрим всех администраторов
SELECT id, name, email, user_type, created_at
FROM users
WHERE user_type = 'admin'
ORDER BY created_at DESC;

-- 4. Если нужно вручную назначить администратора
-- (замените email на нужный)
-- UPDATE users 
-- SET user_type = 'admin', updated_at = CURRENT_TIMESTAMP
-- WHERE email = 'ваш_email@example.com';

-- 5. Проверим события, созданные администраторами
SELECT 
  e.id,
  e.title,
  e.organizer_id,
  u.name as organizer_name,
  u.user_type,
  e.created_at
FROM events e
JOIN users u ON e.organizer_id = u.id
WHERE u.user_type = 'admin'
ORDER BY e.created_at DESC
LIMIT 10;

-- 6. Проверим статьи, созданные администраторами
SELECT 
  a.id,
  a.title,
  a.author_id,
  u.name as author_name,
  u.user_type,
  a.created_at
FROM articles a
JOIN users u ON a.author_id = u.id
WHERE u.user_type = 'admin'
ORDER BY a.created_at DESC
LIMIT 10;

-- =============================================
-- Готово!
-- =============================================

