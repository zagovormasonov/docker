# 🐳 Деплой Synergy через Docker

Простая инструкция для развертывания всего приложения на сервере одной командой.

---

## 📋 Что будет установлено

- ✅ **PostgreSQL** - база данных
- ✅ **Backend** - Node.js API сервер
- ✅ **Frontend** - React приложение с Nginx
- ✅ **Все зависимости** автоматически

---

## 🚀 Быстрый старт (3 команды)

### 1. Подключитесь к серверу

```bash
ssh root@ваш-сервер-ip
```

### 2. Установите Docker (если еще не установлен)

```bash
# Для Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
apt install docker-compose-plugin -y

# Проверка
docker --version
docker compose version
```

### 3. Загрузите проект на сервер

**Вариант A: Через Git**

```bash
cd /opt
git clone https://your-repository.git synergy
cd synergy
```

**Вариант B: Через SFTP/SCP**

Загрузите всю папку проекта на сервер в `/opt/synergy`

---

## ⚙️ Настройка (обязательно!)

### 1. Создайте файл окружения

```bash
cd /opt/synergy
nano .env.production
```

Вставьте и **измените** значения:

```env
# База данных - придумайте надежный пароль!
DB_PASSWORD=ваш_надежный_пароль_БД

# JWT секрет - сгенерируйте случайный ключ!
JWT_SECRET=ваш_супер_секретный_ключ_для_JWT

# URL вашего сайта
FRONTEND_URL=http://ваш-домен.ru

# Порт (80 для HTTP, 443 для HTTPS)
PORT=80
```

### 2. Сгенерируйте JWT секрет

```bash
openssl rand -hex 32
# Скопируйте результат в JWT_SECRET
```

---

## 🎯 Запуск приложения

### Простой запуск (одна команда!)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

✨ **Готово!** Приложение запущено!

---

## 🌐 Проверка работы

### 1. Проверьте статус контейнеров

```bash
docker compose -f docker-compose.prod.yml ps
```

Должны быть запущены:
- ✅ `synergy-postgres` (healthy)
- ✅ `synergy-backend` (healthy)
- ✅ `synergy-frontend` (healthy)

### 2. Проверьте логи

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs

# Только backend
docker compose -f docker-compose.prod.yml logs backend

# Следить в реальном времени
docker compose -f docker-compose.prod.yml logs -f
```

### 3. Откройте в браузере

```
http://ваш-сервер-ip
```

Должна открыться главная страница Synergy! 🎉

---

## 🔧 Управление приложением

### Остановить

```bash
docker compose -f docker-compose.prod.yml stop
```

### Запустить снова

```bash
docker compose -f docker-compose.prod.yml start
```

### Перезапустить

```bash
docker compose -f docker-compose.prod.yml restart
```

### Полностью удалить (с данными!)

```bash
docker compose -f docker-compose.prod.yml down -v
```

### Обновить приложение

```bash
# 1. Загрузите новый код
git pull  # или загрузите через SFTP

# 2. Пересоберите и перезапустите
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔒 Настройка HTTPS (SSL)

### С использованием Certbot

1. **Установите Certbot**

```bash
apt install certbot python3-certbot-nginx -y
```

2. **Создайте nginx конфиг на хосте**

```bash
nano /etc/nginx/sites-available/synergy
```

Вставьте:

```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Активируйте и получите SSL**

```bash
ln -s /etc/nginx/sites-available/synergy /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

4. **Обновите .env.production**

```env
FRONTEND_URL=https://ваш-домен.ru
```

5. **Перезапустите**

```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

## 📊 Мониторинг

### Использование ресурсов

```bash
docker stats
```

### Размер образов

```bash
docker images
```

### Логи определенного сервиса

```bash
docker compose -f docker-compose.prod.yml logs backend -f --tail=100
```

---

## 🗄️ Backup базы данных

### Создать backup

```bash
docker exec synergy-postgres pg_dump -U synergy synergy_db > backup_$(date +%Y%m%d).sql
```

### Восстановить из backup

```bash
docker exec -i synergy-postgres psql -U synergy synergy_db < backup_20250101.sql
```

### Автоматический backup (cron)

```bash
crontab -e
```

Добавьте:

```cron
# Backup каждый день в 3:00
0 3 * * * docker exec synergy-postgres pg_dump -U synergy synergy_db > /opt/backups/synergy_$(date +\%Y\%m\%d).sql
```

---

## 🔍 Устранение проблем

### Backend не запускается

```bash
docker compose -f docker-compose.prod.yml logs backend
```

Проверьте:
- ✅ DATABASE_URL корректный
- ✅ PostgreSQL запущен и healthy
- ✅ Порт 3001 не занят

### Frontend не доступен

```bash
docker compose -f docker-compose.prod.yml logs frontend
```

Проверьте:
- ✅ Порт 80 открыт в firewall
- ✅ Backend доступен
- ✅ Nginx конфиг корректный

### База данных не подключается

```bash
# Проверка подключения к PostgreSQL
docker exec -it synergy-postgres psql -U synergy -d synergy_db
```

### Очистка логов (если занимают много места)

```bash
docker system prune -a
```

---

## 🎛️ Переменные окружения

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `DB_PASSWORD` | Пароль PostgreSQL | synergy_secure_password_2025 |
| `JWT_SECRET` | Секретный ключ для JWT | (обязательно измените!) |
| `FRONTEND_URL` | URL вашего сайта | http://localhost |
| `PORT` | Порт для frontend | 80 |

---

## 📈 Масштабирование

### Увеличить ресурсы PostgreSQL

Добавьте в `docker-compose.prod.yml` в секцию postgres:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### Несколько backend экземпляров

```bash
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## ✅ Чеклист деплоя

- [ ] Docker и Docker Compose установлены
- [ ] Проект загружен на сервер
- [ ] Создан `.env.production` с уникальными паролями
- [ ] JWT_SECRET сгенерирован
- [ ] FRONTEND_URL указан правильно
- [ ] Порт 80 (или 443) открыт в firewall
- [ ] Запущен: `docker compose up -d`
- [ ] Проверены логи (нет ошибок)
- [ ] Приложение открывается в браузере
- [ ] Настроен SSL (опционально)
- [ ] Настроен backup базы данных

---

## 🎉 Готово!

Ваше приложение Synergy развернуто и работает!

**Полезные команды:**

```bash
# Статус
docker compose -f docker-compose.prod.yml ps

# Логи
docker compose -f docker-compose.prod.yml logs -f

# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Обновление
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

**Помощь:** При возникновении проблем проверьте логи командой выше.
