-- Скрипт для ручной верификации email адресов
-- Выполните этот скрипт в базе данных

-- Проверяем текущий статус пользователей
SELECT 
    id, 
    name, 
    email, 
    email_verified,
    created_at
FROM users 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');

-- Обновляем статус верификации
UPDATE users 
SET email_verified = true 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');

-- Проверяем результат
SELECT 
    id, 
    name, 
    email, 
    email_verified,
    created_at
FROM users 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');

-- Показываем общую статистику верифицированных пользователей
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_users
FROM users;

