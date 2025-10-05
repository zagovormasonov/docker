-- Исправление: сделать пользователя samyrize77777@gmail.com администратором
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'samyrize77777@gmail.com';

-- Проверка результата
SELECT id, name, email, user_type 
FROM users 
WHERE email = 'samyrize77777@gmail.com';

-- Если пользователь не найден, покажем всех пользователей
SELECT id, name, email, user_type 
FROM users 
ORDER BY id;
