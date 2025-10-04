# 🔥 Исправление firewall для pgAdmin

## ✅ Порт проброшен правильно
`80/tcp -> 0.0.0.0:8082` - это означает, что Docker правильно пробросил порт.

## 🔧 Проблема: Firewall блокирует порт 8082

### 1. Откройте порт 8082 в firewall:
```bash
sudo ufw allow 8082
sudo ufw reload
```

### 2. Проверьте статус firewall:
```bash
sudo ufw status
```

### 3. Проверьте, что порт открыт:
```bash
sudo netstat -tulpn | grep :8082
```

## 🔧 Если проблема с Nginx

### Проверьте конфигурацию Nginx:
```bash
sudo nginx -t
```

### Добавьте в Nginx конфигурацию для порта 8082:
```nginx
server {
    listen 8082;
    server_name soulsynergy.ru;
    
    location / {
        proxy_pass http://localhost:8082;
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

### Если ничего не помогает, попробуйте другой порт:
```bash
# Остановите текущий
docker stop synergy-pgadmin
docker rm synergy-pgadmin

# Запустите на порту 8083
docker run -d \
  --name synergy-pgadmin \
  -p 8083:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@soulsynergy.ru \
  -e PGADMIN_DEFAULT_PASSWORD=admin123 \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  dpage/pgadmin4:latest

# Откройте порт 8083
sudo ufw allow 8083
sudo ufw reload
```

### Тогда откройте: **https://soulsynergy.ru:8083**

## 🔍 Проверьте результат

### После исправления проверьте:
```bash
# Проверьте статус
docker ps | grep pgadmin

# Проверьте порты
docker port synergy-pgadmin

# Проверьте доступность
curl -I http://localhost:8082
```

## 🎯 Если все еще не работает

### Попробуйте открыть напрямую IP сервера:
```bash
# Узнайте IP сервера
curl ifconfig.me
# Откройте http://IP_СЕРВЕРА:8082
```

## 🔧 Проверьте, что pgAdmin отвечает внутри контейнера:
```bash
docker exec -it synergy-pgadmin curl localhost:80
```
