# 🗄️ Настройка графического интерфейса для БД (pgAdmin)

## 🚀 Запуск pgAdmin

1. **Запустите контейнеры:**
   ```bash
   docker-compose up -d
   ```

2. **Откройте pgAdmin в браузере:**
   - URL: `http://localhost:8080`
   - Email: `admin@soulsynergy.ru`
   - Пароль: `admin123`

## 🔗 Подключение к базе данных

1. **В pgAdmin нажмите "Add New Server"**

2. **General tab:**
   - Name: `SoulSynergy DB`

3. **Connection tab:**
   - Host name/address: `postgres` (имя контейнера)
   - Port: `5432`
   - Username: `synergy`
   - Password: `synergy123`
   - Database: `synergy_db`

4. **Нажмите "Save"**

## 📊 Возможности pgAdmin

- **Просмотр таблиц** - все таблицы в базе данных
- **Редактирование данных** - изменение записей через интерфейс
- **Выполнение SQL** - запуск SQL запросов
- **Создание/удаление таблиц** - управление структурой БД
- **Экспорт/импорт данных** - резервное копирование
- **Мониторинг** - статистика и производительность

## 🔧 Полезные операции

### Просмотр всех пользователей:
```sql
SELECT id, name, email, user_type, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Ручная верификация email:
```sql
UPDATE users 
SET email_verified = true 
WHERE email = 'user@example.com';
```

### Изменение типа пользователя:
```sql
UPDATE users 
SET user_type = 'expert' 
WHERE id = 123;
```

### Просмотр чатов:
```sql
SELECT c.*, u1.name as user1_name, u2.name as user2_name
FROM chats c
JOIN users u1 ON c.user1_id = u1.id
JOIN users u2 ON c.user2_id = u2.id
ORDER BY c.created_at DESC;
```

### Просмотр сообщений:
```sql
SELECT m.*, u.name as sender_name
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.chat_id = 1
ORDER BY m.created_at;
```

## ⚠️ Важные замечания

- **Всегда делайте бэкап** перед изменениями
- **Тестируйте запросы** на тестовых данных
- **Не удаляйте системные таблицы**
- **Сохраняйте изменения** после редактирования

## 🆘 Если что-то не работает

1. **Проверьте, что контейнеры запущены:**
   ```bash
   docker-compose ps
   ```

2. **Перезапустите pgAdmin:**
   ```bash
   docker-compose restart pgadmin
   ```

3. **Проверьте логи:**
   ```bash
   docker-compose logs pgadmin
   ```

## 📱 Доступ

- **Локально:** http://localhost:8080
- **В продакшене:** http://your-domain.com:8080 (если настроен)
