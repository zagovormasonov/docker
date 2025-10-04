# 🔧 Исправление конфликта контейнера pgAdmin

## ❌ Проблема
Контейнер `synergy-pgadmin` уже существует и конфликтует с новым.

## 🚀 Решение

### 1. Остановите и удалите существующий контейнер:
```bash
docker stop synergy-pgadmin
docker rm synergy-pgadmin
```

### 2. Запустите pgAdmin заново:
```bash
docker-compose up -d pgadmin
```

### 3. Проверьте статус:
```bash
docker ps | grep pgadmin
```

## 🔧 Альтернативное решение

### Если docker-compose не работает, запустите напрямую:
```bash
# Удалите старый контейнер
docker stop synergy-pgadmin
docker rm synergy-pgadmin

# Запустите новый контейнер
docker run -d \
  --name synergy-pgadmin \
  -p 8081:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@soulsynergy.ru \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  dpage/pgadmin4:latest
```

## 🔍 Проверка результата

### После исправления проверьте:
```bash
# Проверьте статус
docker ps | grep pgadmin

# Проверьте порты
docker port synergy-pgadmin

# Проверьте логи
docker logs synergy-pgadmin
```

### Откройте в браузере:
- **URL:** https://soulsynergy.ru:8081
- **Email:** admin@soulsynergy.ru
- **Пароль:** admin123

## 🆘 Если все еще не работает

### Полная очистка и пересоздание:
```bash
# Остановите все контейнеры проекта
docker-compose down

# Удалите все контейнеры проекта
docker-compose rm -f

# Запустите заново
docker-compose up -d
```

### Или используйте другой порт:
```bash
# Запустите на порту 8082
docker run -d \
  --name synergy-pgadmin \
  -p 8082:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@soulsynergy.ru \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  dpage/pgadmin4:latest

# Откройте порт 8082
sudo ufw allow 8082
sudo ufw reload
```

### Тогда откройте: **https://soulsynergy.ru:8082**
