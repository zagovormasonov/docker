# 🚀 Быстрый запуск pgAdmin на сервере

## ⚡ Решение проблемы с портом 5432

Поскольку PostgreSQL уже запущен, используйте отдельный файл для pgAdmin:

### 1. **Скопируйте файл на сервер:**
```bash
# Скопируйте docker-compose.pgadmin.yml на сервер
```

### 2. **Запустите только pgAdmin:**
```bash
docker-compose -f docker-compose.pgadmin.yml up -d
```

### 3. **Проверьте статус:**
```bash
docker-compose -f docker-compose.pgadmin.yml ps
```

### 4. **Откройте в браузере:**
- **URL:** https://soulsynergy.ru:8081
- **Email:** admin@soulsynergy.ru
- **Пароль:** admin123

## 🔧 Альтернативный способ (если первый не работает)

### Вариант 1: Запустить pgAdmin без docker-compose
```bash
docker run -d \
  --name synergy-pgadmin \
  -p 8081:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@soulsynergy.ru \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  --link synergy-postgres:postgres \
  dpage/pgadmin4:latest
```

### Вариант 2: Остановить PostgreSQL и запустить все заново
```bash
# Остановить существующий PostgreSQL
docker stop synergy-postgres

# Запустить все контейнеры
docker-compose up -d
```

## 🔗 Настройка подключения к БД

1. **В pgAdmin нажмите "Add New Server"**

2. **General tab:**
   - Name: `SoulSynergy DB`

3. **Connection tab:**
   - Host name/address: `postgres` (или IP контейнера PostgreSQL)
   - Port: `5432`
   - Username: `synergy`
   - Password: `synergy123`
   - Database: `synergy_db`

4. **Нажмите "Save"**

## 🆘 Если что-то не работает

### Проверьте, что PostgreSQL запущен:
```bash
docker ps | grep postgres
```

### Проверьте IP PostgreSQL контейнера:
```bash
docker inspect synergy-postgres | grep IPAddress
```

### Используйте IP вместо имени контейнера в настройках подключения

## ✅ Готово!

После успешного подключения вы сможете:
- Просматривать все таблицы
- Редактировать данные пользователей
- Выполнять SQL запросы
- Экспортировать/импортировать данные
