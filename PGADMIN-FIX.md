# 🔧 Исправление pgAdmin

## ✅ pgAdmin работает внутри контейнера
Логи показывают, что pgAdmin запущен и слушает на порту 80.

## 🔍 Проверьте проброс портов

### 1. Проверьте, что порт 8081 проброшен:
```bash
docker port synergy-pgadmin
```

### 2. Проверьте, что контейнер слушает на всех интерфейсах:
```bash
docker inspect synergy-pgadmin | grep -A 10 "PortBindings"
```

### 3. Проверьте, что порт 8081 открыт на хосте:
```bash
sudo netstat -tulpn | grep :8081
```

## 🔧 Если порт не проброшен

### Пересоздайте контейнер с правильными настройками:
```bash
# Остановите и удалите контейнер
docker stop synergy-pgadmin
docker rm synergy-pgadmin

# Запустите заново
docker-compose up -d pgadmin
```

## 🔧 Если порт заблокирован firewall

### Откройте порт 8081:
```bash
sudo ufw allow 8081
sudo ufw reload
```

## 🔧 Если проблема с Nginx

### Проверьте конфигурацию Nginx:
```bash
sudo nginx -t
```

### Добавьте в Nginx конфигурацию:
```nginx
server {
    listen 8081;
    server_name soulsynergy.ru;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Перезагрузите Nginx:
```bash
sudo systemctl reload nginx
```

## 🚀 Альтернативное решение

### Запустите pgAdmin на другом порту:
```bash
# Остановите текущий
docker stop synergy-pgadmin
docker rm synergy-pgadmin

# Запустите на порту 8082
docker run -d \
  --name synergy-pgadmin \
  -p 8082:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@soulsynergy.ru \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  dpage/pgadmin4:latest
```

### Тогда откройте: https://soulsynergy.ru:8082

## 🔍 Проверьте результат

### После исправления проверьте:
```bash
# Проверьте статус
docker ps | grep pgadmin

# Проверьте порты
docker port synergy-pgadmin

# Проверьте доступность
curl -I http://localhost:8081
```

## 🎯 Если все еще не работает

### Попробуйте открыть напрямую IP сервера:
```bash
# Узнайте IP сервера
curl ifconfig.me
# Откройте http://IP_СЕРВЕРА:8081
```
