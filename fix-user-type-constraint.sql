-- Исправление ограничения user_type для добавления типа 'admin'

-- 1. Удаляем старое ограничение
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 2. Добавляем новое ограничение с типом 'admin'
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('client', 'expert', 'admin'));

-- 3. Назначаем пользователя администратором
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'samyrize77777@gmail.com';

-- 4. Проверяем результат
SELECT id, name, email, user_type 
FROM users 
WHERE email = 'samyrize77777@gmail.com';
