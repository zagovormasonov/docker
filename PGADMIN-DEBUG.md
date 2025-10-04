# 🔍 Диагностика pgAdmin

## 1. Проверьте статус контейнеров
```bash
docker ps
```

## 2. Проверьте логи pgAdmin
```bash
docker logs synergy-pgadmin
```

## 3. Проверьте, что порт 8081 открыт
```bash
sudo netstat -tulpn | grep :8081
```

## 4. Проверьте firewall
```bash
sudo ufw status
```

## 5. Проверьте, что контейнер запущен
```bash
docker-compose ps
```

## 6. Если контейнер не запущен, запустите его
```bash
docker-compose up -d pgadmin
```

## 7. Проверьте, что pgAdmin отвечает внутри контейнера
```bash
docker exec -it synergy-pgadmin curl localhost:80
```

## 8. Проверьте Nginx конфигурацию (если используется)
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Попробуйте открыть напрямую IP сервера
```bash
# Узнайте IP сервера
curl ifconfig.me
# Откройте http://IP_СЕРВЕРА:8081
```

## 10. Проверьте, что порт не заблокирован
```bash
sudo ufw allow 8081
```

## 🆘 Если ничего не помогает

### Пересоздайте контейнер pgAdmin:
```bash
docker-compose down pgadmin
docker-compose up -d pgadmin
```

### Или удалите и создайте заново:
```bash
docker stop synergy-pgadmin
docker rm synergy-pgadmin
docker-compose up -d pgadmin
```

### Проверьте, что образ pgAdmin скачан:
```bash
docker images | grep pgadmin
```

### Если образ не скачан:
```bash
docker pull dpage/pgadmin4:latest
```
