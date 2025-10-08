# 🗄️ Настройка базы данных для админской панели

## ❌ Проблема

Ошибка 500 при обращении к `/api/admin/events` указывает на то, что в базе данных отсутствуют необходимые таблицы.

## ✅ Решение

### 1. Проверьте существующие таблицы

Выполните в вашей базе данных:

```sql
-- Проверяем, какие таблицы существуют
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'articles', 'events', 'notifications')
ORDER BY table_name;
```

### 2. Создайте недостающие таблицы

Выполните SQL скрипт `CHECK-ALL-TABLES.sql`:

```bash
# Через psql
psql -d synergy_db -f CHECK-ALL-TABLES.sql

# Или через pgAdmin
# Скопируйте содержимое CHECK-ALL-TABLES.sql и выполните
```

### 3. Проверьте структуру таблиц

После выполнения скрипта проверьте:

```sql
-- Проверяем финальное состояние
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('users', 'articles', 'events', 'notifications')
AND table_schema = 'public'
ORDER BY table_name;
```

## 📋 Необходимые таблицы

### 👥 **users** (должна существовать)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    userType VARCHAR(50) DEFAULT 'user',
    -- другие поля...
);
```

### 📝 **articles** (создается скриптом)
```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📅 **events** (создается скриптом)
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔔 **notifications** (создается скриптом)
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 После настройки

1. **Перезапустите backend** сервер
2. **Откройте админскую панель** - ошибки должны исчезнуть
3. **Проверьте логи** - должны появиться сообщения о загрузке данных

## 🔍 Диагностика

### Логи backend должны показать:
```
🔍 Запрос статей для админа
📊 Таблица articles существует: true
✅ Статьи загружены: X

🔍 Запрос событий для админа  
📊 Таблица events существует: true
✅ События загружены: X
```

### Если таблицы отсутствуют:
```
📊 Таблица articles существует: false
📊 Таблица events существует: false
```

## ⚠️ Важно

- **Таблица `users`** должна существовать (создается при регистрации)
- **Остальные таблицы** создаются скриптом `CHECK-ALL-TABLES.sql`
- **Права администратора** проверяются через `userType: 'admin'`

После выполнения всех шагов админская панель должна работать корректно! 🎉
