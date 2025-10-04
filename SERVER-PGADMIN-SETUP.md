# 🗄️ Настройка pgAdmin на сервере

## 🚀 Шаги для запуска pgAdmin на сервере

### 1. Обновите docker-compose.yml на сервере
Убедитесь, что в файле `docker-compose.yml` есть секция pgAdmin:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: synergy-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@soulsynergy.ru
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "8080:80"
    depends_on:
      - postgres
    volumes:
      - pgadmin_data:/var/lib/pgadmin
```

### 2. Запустите pgAdmin на сервере
```bash
# На сервере выполните:
docker-compose up -d pgadmin
```

### 3. Проверьте статус контейнеров
```bash
docker-compose ps
```

### 4. Проверьте логи pgAdmin
```bash
docker-compose logs pgadmin
```

### 5. Откройте pgAdmin в браузере
- **URL:** https://soulsynergy.ru:8081
- **Email:** admin@soulsynergy.ru  
- **Пароль:** admin123

## 🔧 Настройка подключения к БД в pgAdmin

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

## 🔒 Настройка безопасности

### Если pgAdmin не открывается, проверьте:

1. **Firewall на сервере:**
   ```bash
   # Откройте порт 8081
   sudo ufw allow 8081
   ```

2. **Nginx конфигурация (если используется):**
   ```nginx
   server {
       listen 8081;
       server_name soulsynergy.ru;
       
       location / {
           proxy_pass http://localhost:8081;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Проверьте, что контейнер запущен:**
   ```bash
   docker ps | grep pgadmin
   ```

## 🆘 Решение проблем

### Если порт 8081 занят:
```bash
# Найдите процесс, использующий порт
sudo netstat -tulpn | grep :8081

# Остановите его или измените порт в docker-compose.yml
```

### Если контейнер не запускается:
```bash
# Пересоздайте контейнер
docker-compose down pgadmin
docker-compose up -d pgadmin
```

### Если забыли пароль:
```bash
# Сбросьте пароль через переменную окружения
docker-compose down pgadmin
docker-compose up -d pgadmin -e PGADMIN_DEFAULT_PASSWORD=newpassword
```

## 📊 Доступ к данным

После подключения к БД вы сможете:
- Просматривать все таблицы
- Редактировать данные пользователей
- Выполнять SQL запросы
- Экспортировать/импортировать данные
- Мониторить производительность

## 🔐 Безопасность

⚠️ **Важно:** pgAdmin доступен по HTTP. Для продакшена рекомендуется:
- Настроить HTTPS
- Ограничить доступ по IP
- Использовать сильные пароли
- Регулярно обновлять pgAdmin
