# Инструкция для верификации email адресов

## 🎯 Задача
Подтвердить email адреса для пользователей:
- `trufelleg@gmail.com`
- `gr-light369@yandex.ru`

## 🛠️ Способы выполнения

### Способ 1: Через pgAdmin (Рекомендуемый)

1. **Откройте pgAdmin**: `http://localhost:5050`
2. **Войдите в систему**:
   - Email: `admin@example.com`
   - Пароль: `admin123`
3. **Подключитесь к серверу**:
   - Host: `postgres`
   - Port: `5432`
   - Username: `synergy`
   - Password: `synergy_secure_password_2025`
4. **Откройте Query Tool** и выполните SQL из файла `verify-emails.sql`

### Способ 2: Через командную строку Docker

```bash
# Если Docker запущен
docker-compose -f docker-compose.prod.yml exec postgres psql -U synergy -d synergy_db -f /path/to/verify-emails.sql

# Или интерактивно
docker-compose -f docker-compose.prod.yml exec postgres psql -U synergy -d synergy_db
```

### Способ 3: Через API (если сервер запущен)

```bash
# Запустите backend
cd backend
npm run dev

# В другом терминале выполните
node verify-emails-api.js
```

## 📊 SQL запросы для выполнения

```sql
-- 1. Проверяем текущий статус
SELECT id, name, email, email_verified, created_at
FROM users 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');

-- 2. Обновляем статус верификации
UPDATE users 
SET email_verified = true 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');

-- 3. Проверяем результат
SELECT id, name, email, email_verified, created_at
FROM users 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');
```

## ✅ Ожидаемый результат

После выполнения пользователи смогут:
- Войти в систему без подтверждения email
- Получить доступ ко всем функциям платформы
- Получать уведомления в чатах

## 🔍 Проверка результата

Выполните запрос для проверки:
```sql
SELECT name, email, email_verified 
FROM users 
WHERE email IN ('trufelleg@gmail.com', 'gr-light369@yandex.ru');
```

Должно показать `email_verified = true` для обоих пользователей.

