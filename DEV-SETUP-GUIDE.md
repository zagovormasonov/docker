# 🛠️ Настройка сервера разработки (DEV)

Для проекта настроен отдельный сервер разработки, который работает в изолированных Docker-контейнерах с собственной базой данных и защищен паролем.

## 📋 Основные характеристики
- **Поддомен:** `dev.yourdomain.com` (настраивается на хосте).
- **База данных:** Отдельная (`synergy_db_dev`), данные сохраняются в volume `postgres_data_dev`.
- **Защита:** Basic Auth (Логин: `admin`, Пароль: `defender007`).
- **Порт:** `8081` (внутри контейнеров 80).

---

## 🚀 Быстрый старт

### 1. Подготовка переменных окружения
Создайте файл `.env.dev` в корне проекта. Вы можете скопировать его из примера:
```bash
cp env.dev.example .env.dev
```
Обязательно проверьте `FRONTEND_URL_DEV` и другие параметры в этом файле.

### 2. Запуск сервера
Запустите специальный скрипт (для Windows):
```bash
.\docker-start-dev.bat
```
Или используйте команду напрямую:
```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
```

---

## 🌐 Настройка поддомена (Nginx на хосте)

Чтобы сервер был доступен по адресу `dev.yourdomain.com`, добавьте конфигурацию в основной Nginx вашего сервера:

```nginx
server {
    listen 80;
    server_name dev.yourdomain.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Важно для WebSocket (чаты)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔒 Безопасность и Доступ
При входе на `dev` версию сайта браузер запросит авторизацию:
- **Логин:** `admin`
- **Пароль:** `defender007`

Эти настройки хранятся в файле [frontend/.htpasswd](file:///c:/Users/user/Desktop/synergy/frontend/.htpasswd) и подключаются через [frontend/nginx.dev.conf](file:///c:/Users/user/Desktop/synergy/frontend/nginx.dev.conf).

---

## 📂 Новые файлы
- [docker-compose.dev.yml](file:///c:/Users/user/Desktop/synergy/docker-compose.dev.yml) — основной конфиг dev-окружения.
- [frontend/nginx.dev.conf](file:///c:/Users/user/Desktop/synergy/frontend/nginx.dev.conf) — конфиг Nginx с Basic Auth.
- [frontend/.htpasswd](file:///c:/Users/user/Desktop/synergy/frontend/.htpasswd) — учетные данные для доступа.
- [docker-start-dev.bat](file:///c:/Users/user/Desktop/synergy/docker-start-dev.bat) — скрипт запуска.
- [env.dev.example](file:///c:/Users/user/Desktop/synergy/env.dev.example) — пример переменных окружения.
