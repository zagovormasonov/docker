# 🐘 Настройка локальной базы данных

## Вариант 1: Docker (рекомендуется) ⭐

### Установка Docker Desktop

1. Скачайте [Docker Desktop для Windows](https://www.docker.com/products/docker-desktop/)
2. Установите и запустите Docker Desktop

### Запуск базы данных

```bash
# Запуск PostgreSQL в контейнере
docker-compose up -d

# Проверка работы
docker-compose ps
```

### Обновите backend/.env

```env
DATABASE_URL=postgresql://synergy:synergy123@localhost:5432/synergy_db
JWT_SECRET=synergy-secret-key-2025-local-dev
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Остановка базы данных

```bash
docker-compose down
```

---

## Вариант 2: PostgreSQL локально

### Для Windows

1. Скачайте PostgreSQL: https://www.postgresql.org/download/windows/
2. Установите (пароль: `synergy123`, порт: `5432`)
3. Создайте базу данных:

```bash
# Откройте pgAdmin или в командной строке:
createdb -U postgres synergy_db
```

4. Обновите `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:synergy123@localhost:5432/synergy_db
JWT_SECRET=synergy-secret-key-2025-local-dev
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Вариант 3: Бесплатный облачный PostgreSQL

### ElephantSQL (бесплатный план)

1. Зарегистрируйтесь: https://www.elephantsql.com/
2. Создайте новую инстанцию (Tiny Turtle - бесплатно)
3. Скопируйте URL подключения
4. Обновите `backend/.env`:

```env
DATABASE_URL=ваш-url-от-elephantsql
JWT_SECRET=synergy-secret-key-2025
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Вариант 4: Подключение к Timeweb через SSH туннель

Если у вас есть SSH доступ к серверу Timeweb:

```bash
# Создайте SSH туннель
ssh -L 5432:localhost:5432 user@ваш-сервер-timeweb

# В другом терминале обновите backend/.env:
DATABASE_URL=postgresql://gen_user:пароль@localhost:5432/default_db
```

---

## ✅ После настройки

Запустите проект:

```bash
npm run dev
```

Backend должен успешно подключиться к базе данных!
