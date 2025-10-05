-- Сделать пользователя samyrize77777@gmail.com администратором
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'samyrize77777@gmail.com';

-- Проверить результат
SELECT id, name, email, user_type 
FROM users 
WHERE email = 'samyrize77777@gmail.com';
