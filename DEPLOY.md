# 🚢 Деплой Synergy на Timeweb Cloud

Пошаговая инструкция по развертыванию платформы на вашем сервере Timeweb Cloud.

## 📋 Что вам понадобится

- ✅ Сервер на Timeweb Cloud (Ubuntu/Debian)
- ✅ SSH доступ к серверу
- ✅ Доменное имя (опционально)
- ✅ База данных PostgreSQL (уже настроена)

## 🔧 Шаг 1: Подготовка сервера

### 1.1 Подключение к серверу

```bash
ssh root@ваш-сервер-ip
```

### 1.2 Обновление системы

```bash
apt update && apt upgrade -y
```

### 1.3 Установка Node.js

```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Проверка установки
node -v  # должно быть >= 18
npm -v
```

### 1.4 Установка PM2 (менеджер процессов)

```bash
npm install -g pm2
```

### 1.5 Установка Nginx

```bash
apt install -y nginx
```

## 📦 Шаг 2: Загрузка проекта

### 2.1 Создание директории

```bash
mkdir -p /var/www/synergy
cd /var/www/synergy
```

### 2.2 Загрузка кода

**Вариант A: Через Git (если проект в репозитории)**

```bash
git clone https://ваш-репозиторий.git .
```

**Вариант B: Загрузка через SFTP**

Используйте FileZilla или WinSCP для загрузки файлов в `/var/www/synergy`

## 🔨 Шаг 3: Настройка Backend

### 3.1 Установка зависимостей

```bash
cd /var/www/synergy/backend
npm install --production
```

### 3.2 Настройка переменных окружения

```bash
nano .env
```

Вставьте (замените `yourdomain.com` на ваш домен):

```env
DATABASE_URL=postgresql://gen_user:OCS(ifoR||A5$~@40e0a3b39459bee0b2e47359.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=измените-на-уникальный-секретный-ключ
PORT=3001
FRONTEND_URL=https://yourdomain.com
```

> ⚠️ **Важно**: Сгенерируйте уникальный `JWT_SECRET`!

```bash
# Генерация случайного ключа
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Сборка проекта

```bash
npm run build
```

### 3.4 Запуск с PM2

```bash
pm2 start dist/server.js --name synergy-backend
pm2 save
pm2 startup
```

Проверка статуса:

```bash
pm2 status
pm2 logs synergy-backend
```

## 🎨 Шаг 4: Настройка Frontend

### 4.1 Сборка локально

На вашем компьютере:

```bash
cd frontend

# Измените URL API если нужно
# В src/api/axios.ts и src/api/socket.ts

npm run build
```

### 4.2 Загрузка на сервер

Загрузите содержимое папки `frontend/dist/` на сервер в `/var/www/synergy/frontend/`

Или на сервере:

```bash
cd /var/www/synergy/frontend
npm install
npm run build
```

## 🌐 Шаг 5: Настройка Nginx

### 5.1 Создание конфигурации

```bash
nano /etc/nginx/sites-available/synergy
```

Вставьте:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    root /var/www/synergy/frontend/dist;
    index index.html;

    # Логи
    access_log /var/log/nginx/synergy-access.log;
    error_log /var/log/nginx/synergy-error.log;

    # Основное приложение
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy для API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket для чатов
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Кэширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.2 Активация конфигурации

```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/synergy /etc/nginx/sites-enabled/

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl restart nginx
```

## 🔒 Шаг 6: Настройка HTTPS (SSL)

### 6.1 Установка Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Получение SSL сертификата

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Следуйте инструкциям на экране.

### 6.3 Автообновление сертификата

```bash
certbot renew --dry-run
```

Сертификат будет обновляться автоматически.

## 🔥 Шаг 7: Настройка Firewall

```bash
# Разрешить Nginx
ufw allow 'Nginx Full'

# Разрешить SSH
ufw allow ssh

# Включить firewall
ufw enable

# Проверка статуса
ufw status
```

## ✅ Шаг 8: Проверка работы

1. Откройте браузер
2. Перейдите на `https://yourdomain.com`
3. Зарегистрируйтесь и протестируйте функционал

## 📊 Мониторинг и логи

### PM2 логи

```bash
pm2 logs synergy-backend
pm2 monit
```

### Nginx логи

```bash
tail -f /var/log/nginx/synergy-access.log
tail -f /var/log/nginx/synergy-error.log
```

### Перезапуск сервисов

```bash
# Backend
pm2 restart synergy-backend

# Nginx
systemctl restart nginx
```

## 🔄 Обновление приложения

### Backend

```bash
cd /var/www/synergy/backend
git pull  # если используете Git
npm install
npm run build
pm2 restart synergy-backend
```

### Frontend

```bash
# Локально
npm run build

# Загрузите новый dist/ на сервер
# Или на сервере:
cd /var/www/synergy/frontend
git pull
npm install
npm run build
```

## 🛠️ Оптимизация

### Сжатие Gzip

Добавьте в `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Кэширование

Уже настроено в конфиге Nginx выше.

## 🆘 Устранение проблем

### Backend не запускается

```bash
pm2 logs synergy-backend --lines 100
```

### Проблемы с базой данных

Проверьте `DATABASE_URL` в `.env`

### 502 Bad Gateway

```bash
# Проверьте работу backend
pm2 status

# Проверьте порт
netstat -tlnp | grep 3001

# Проверьте логи nginx
tail -f /var/log/nginx/error.log
```

### WebSocket не работает

Убедитесь что в nginx есть блок для `/socket.io`

## 📈 Backup базы данных

```bash
# Создать backup
pg_dump $DATABASE_URL > backup.sql

# Восстановить
psql $DATABASE_URL < backup.sql
```

---

## 🎉 Готово!

Ваше приложение Synergy теперь работает на продакшене!

**Полезные команды:**

```bash
pm2 status              # статус процессов
pm2 restart all        # перезапуск всех процессов
systemctl status nginx # статус nginx
certbot renew          # обновление SSL
```

**Следующие шаги:**
- ✅ Настройте регулярные backup базы данных
- ✅ Настройте мониторинг (например, UptimeRobot)
- ✅ Добавьте CDN для статики (опционально)
