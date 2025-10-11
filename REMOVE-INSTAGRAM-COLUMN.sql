-- Удаление колонки instagram_url из таблицы users
-- Этот скрипт удаляет поле Instagram из профилей пользователей

-- Проверяем, существует ли колонка instagram_url
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'instagram_url'
    ) THEN
        -- Удаляем колонку instagram_url
        ALTER TABLE users DROP COLUMN instagram_url;
        RAISE NOTICE 'Колонка instagram_url успешно удалена из таблицы users';
    ELSE
        RAISE NOTICE 'Колонка instagram_url не существует в таблице users';
    END IF;
END $$;

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('vk_url', 'telegram_url', 'whatsapp', 'instagram_url')
ORDER BY column_name;
