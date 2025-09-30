# 🚀 Инструкция по установке и запуску Synergy

## Предварительные требования

- **Node.js** версии 18 или выше ([скачать](https://nodejs.org/))
- **PostgreSQL** база данных (уже настроена в облаке)
- **Git** (опционально)

## 📦 Шаг 1: Установка зависимостей

Откройте терминал в корневой папке проекта и выполните:

```bash
# Установка зависимостей для backend
cd backend
npm install

# Установка зависимостей для frontend  
cd ../frontend
npm install

# Вернуться в корень
cd ..
```

## ⚙️ Шаг 2: Настройка окружения

Файл `backend/.env` уже создан с настройками базы данных. Проверьте его содержимое:

```env
DATABASE_URL=postgresql://gen_user:OCS(ifoR||A5$~@40e0a3b39459bee0b2e47359.twc1.net:5432/default_db?sslmode=verify-full
JWT_SECRET=synergy-secret-key-2025
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Для продакшена смените `JWT_SECRET` на уникальный ключ!

## 🎯 Шаг 3: Запуск приложения

### Вариант 1: Запуск всего проекта (рекомендуется)

Из корневой папки:

```bash
npm install
npm run dev
```

Это запустит одновременно backend и frontend.

### Вариант 2: Раздельный запуск

**Терминал 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend запустится на http://localhost:3001

**Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend запустится на http://localhost:5173

## 🌐 Шаг 4: Открытие приложения

Откройте браузер и перейдите по адресу:

```
http://localhost:5173
```

## ✅ Проверка работы

1. **Регистрация**: Создайте аккаунт (эксперт или клиент)
2. **Вход**: Войдите в систему
3. **Главная**: Просмотрите статьи
4. **Эксперты**: Найдите экспертов по тематикам
5. **Профиль**: Заполните свой профиль

## 🗄️ База данных

База данных инициализируется автоматически при первом запуске backend. Создаются:
- Все необходимые таблицы
- 29 тематик духовных практик
- Индексы для оптимизации

## 🔧 Устранение неполадок

### Ошибка подключения к базе данных

Проверьте:
1. Правильность `DATABASE_URL` в `backend/.env`
2. Доступность интернета (база в облаке)
3. Что порт 5432 не заблокирован

### Ошибки при установке зависимостей

```bash
# Очистка кэша npm
npm cache clean --force

# Повторная установка
rm -rf node_modules
npm install
```

### Порт уже занят

Если порт 3001 или 5173 занят, измените в файлах:
- Backend: `backend/.env` → `PORT=3002`
- Frontend: `frontend/vite.config.ts` → `server.port`

## 📱 Тестирование на мобильных

1. Узнайте локальный IP: `ipconfig` (Windows) или `ifconfig` (Mac/Linux)
2. В `backend/.env` добавьте IP в `FRONTEND_URL`
3. Откройте на телефоне: `http://[ваш-IP]:5173`

## 🚢 Деплой на Timeweb Cloud

### Backend

1. Загрузите код на сервер
2. Установите зависимости: `npm install`
3. Соберите: `npm run build`
4. Установите PM2: `npm install -g pm2`
5. Запустите: `pm2 start dist/server.js --name synergy-backend`

### Frontend

1. Локально соберите: `npm run build`
2. Загрузите папку `dist/` на хостинг
3. Настройте nginx для SPA-приложения

**Пример конфига nginx:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/synergy/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📞 Поддержка

При возникновении проблем проверьте:
- Логи backend: в терминале где запущен backend
- Консоль браузера: F12 → Console
- Версии Node.js: `node -v` (должна быть >= 18)

---

**Готово! 🎉 Приятной работы с Synergy!**
