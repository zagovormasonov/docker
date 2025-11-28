-- =============================================
-- Добавление поля slug для уникальных URL экспертов
-- =============================================

-- 1. Добавляем поле slug в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 2. Создаем индекс для быстрого поиска по slug
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);

-- 3. Комментарий к колонке
COMMENT ON COLUMN users.slug IS 'Уникальный URL-идентификатор пользователя (транслитерация имени)';

-- 4. Функция для транслитерации русских букв в латинские
CREATE OR REPLACE FUNCTION transliterate(text_input TEXT) 
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := text_input;
  
  -- Заменяем русские буквы на латинские
  result := REPLACE(result, 'а', 'a');
  result := REPLACE(result, 'б', 'b');
  result := REPLACE(result, 'в', 'v');
  result := REPLACE(result, 'г', 'g');
  result := REPLACE(result, 'д', 'd');
  result := REPLACE(result, 'е', 'e');
  result := REPLACE(result, 'ё', 'yo');
  result := REPLACE(result, 'ж', 'zh');
  result := REPLACE(result, 'з', 'z');
  result := REPLACE(result, 'и', 'i');
  result := REPLACE(result, 'й', 'y');
  result := REPLACE(result, 'к', 'k');
  result := REPLACE(result, 'л', 'l');
  result := REPLACE(result, 'м', 'm');
  result := REPLACE(result, 'н', 'n');
  result := REPLACE(result, 'о', 'o');
  result := REPLACE(result, 'п', 'p');
  result := REPLACE(result, 'р', 'r');
  result := REPLACE(result, 'с', 's');
  result := REPLACE(result, 'т', 't');
  result := REPLACE(result, 'у', 'u');
  result := REPLACE(result, 'ф', 'f');
  result := REPLACE(result, 'х', 'h');
  result := REPLACE(result, 'ц', 'ts');
  result := REPLACE(result, 'ч', 'ch');
  result := REPLACE(result, 'ш', 'sh');
  result := REPLACE(result, 'щ', 'sch');
  result := REPLACE(result, 'ъ', '');
  result := REPLACE(result, 'ы', 'y');
  result := REPLACE(result, 'ь', '');
  result := REPLACE(result, 'э', 'e');
  result := REPLACE(result, 'ю', 'yu');
  result := REPLACE(result, 'я', 'ya');
  
  -- Заглавные буквы
  result := REPLACE(result, 'А', 'A');
  result := REPLACE(result, 'Б', 'B');
  result := REPLACE(result, 'В', 'V');
  result := REPLACE(result, 'Г', 'G');
  result := REPLACE(result, 'Д', 'D');
  result := REPLACE(result, 'Е', 'E');
  result := REPLACE(result, 'Ё', 'Yo');
  result := REPLACE(result, 'Ж', 'Zh');
  result := REPLACE(result, 'З', 'Z');
  result := REPLACE(result, 'И', 'I');
  result := REPLACE(result, 'Й', 'Y');
  result := REPLACE(result, 'К', 'K');
  result := REPLACE(result, 'Л', 'L');
  result := REPLACE(result, 'М', 'M');
  result := REPLACE(result, 'Н', 'N');
  result := REPLACE(result, 'О', 'O');
  result := REPLACE(result, 'П', 'P');
  result := REPLACE(result, 'Р', 'R');
  result := REPLACE(result, 'С', 'S');
  result := REPLACE(result, 'Т', 'T');
  result := REPLACE(result, 'У', 'U');
  result := REPLACE(result, 'Ф', 'F');
  result := REPLACE(result, 'Х', 'H');
  result := REPLACE(result, 'Ц', 'Ts');
  result := REPLACE(result, 'Ч', 'Ch');
  result := REPLACE(result, 'Ш', 'Sh');
  result := REPLACE(result, 'Щ', 'Sch');
  result := REPLACE(result, 'Ъ', '');
  result := REPLACE(result, 'Ы', 'Y');
  result := REPLACE(result, 'Ь', '');
  result := REPLACE(result, 'Э', 'E');
  result := REPLACE(result, 'Ю', 'Yu');
  result := REPLACE(result, 'Я', 'Ya');
  
  -- Заменяем пробелы на дефисы и удаляем специальные символы
  result := LOWER(result);
  result := REGEXP_REPLACE(result, '[^a-z0-9-]', '-', 'g');
  result := REGEXP_REPLACE(result, '-+', '-', 'g');
  result := TRIM(BOTH '-' FROM result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Функция для генерации уникального slug
CREATE OR REPLACE FUNCTION generate_unique_slug(user_name TEXT, user_id INTEGER) 
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Транслитерируем имя
  base_slug := transliterate(user_name);
  final_slug := base_slug;
  
  -- Проверяем уникальность и добавляем счетчик если нужно
  WHILE EXISTS (SELECT 1 FROM users WHERE slug = final_slug AND id != user_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 6. Генерируем slug для всех существующих пользователей
DO $$
DECLARE
  user_record RECORD;
  new_slug TEXT;
BEGIN
  FOR user_record IN SELECT id, name FROM users WHERE slug IS NULL LOOP
    new_slug := generate_unique_slug(user_record.name, user_record.id);
    UPDATE users SET slug = new_slug WHERE id = user_record.id;
  END LOOP;
END $$;

-- 7. Проверяем результат
SELECT id, name, slug, user_type 
FROM users 
WHERE user_type IN ('expert', 'admin')
ORDER BY id;

-- =============================================
-- Готово! Поле slug добавлено и заполнено
-- =============================================

