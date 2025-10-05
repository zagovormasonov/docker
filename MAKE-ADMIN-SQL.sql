-- Сделать пользователя samyrize77777@gmail.com администратором
-- Выполните этот SQL запрос в базе данных

-- Обновляем тип пользователя на admin
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'samyrize77777@gmail.com';

-- Проверяем результат
SELECT id, name, email, user_type 
FROM users 
WHERE email = 'samyrize77777@gmail.com';
