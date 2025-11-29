-- =============================================
-- Проверка и исправление slug для пользователей
-- =============================================

-- 1. Проверяем, существует ли поле slug
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'slug';

-- Если поле НЕ существует, выполните ADD-USER-SLUG-FIELD.sql!

-- 2. Проверяем, у каких пользователей нет slug
SELECT id, name, user_type, slug 
FROM users 
WHERE slug IS NULL
ORDER BY id;

-- 3. ЕСЛИ У ВАС (ID=21) НЕТ SLUG, выполните:
-- (замените 21 на ваш ID и 'ваше-имя' на транслитерацию вашего имени)

-- Пример для пользователя с ID 21:
-- UPDATE users 
-- SET slug = generate_unique_slug(name, id)
-- WHERE id = 21;

-- 4. Или обновите slug для ВСЕХ пользователей без slug:
DO $$
DECLARE
  user_record RECORD;
  new_slug TEXT;
BEGIN
  FOR user_record IN SELECT id, name FROM users WHERE slug IS NULL LOOP
    new_slug := generate_unique_slug(user_record.name, user_record.id);
    UPDATE users SET slug = new_slug WHERE id = user_record.id;
    RAISE NOTICE 'Обновлен slug для пользователя %: %', user_record.name, new_slug;
  END LOOP;
END $$;

-- 5. Проверяем результат
SELECT id, name, user_type, slug 
FROM users 
WHERE user_type IN ('expert', 'admin')
ORDER BY id;

-- 6. Проверяем конкретно ваш профиль (замените 21 на ваш ID)
SELECT id, name, email, user_type, slug 
FROM users 
WHERE id = 21;

-- =============================================
-- ВАЖНО: После выполнения этого скрипта
-- нужно ПЕРЕЛОГИНИТЬСЯ на сайте!
-- =============================================


