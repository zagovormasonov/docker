# ⚡ Быстрый старт Synergy

## Проблема с подключением к БД? Вот решение! 🔧

Облачная база Timeweb недоступна извне. Используйте локальную БД для разработки:

---

## 🐳 Самый простой способ (Docker)

### 1. Установите Docker Desktop
- Скачайте: https://www.docker.com/products/docker-desktop/
- Установите и запустите

### 2. Запустите PostgreSQL
```bash
docker-compose up -d
```

### 3. Запустите приложение
```bash
npm run dev
```

### 4. Откройте браузер
```
http://localhost:5173
```

**Готово!** 🎉

---

## 🔄 Альтернатива: Бесплатная облачная БД

Если не хотите Docker:

### 1. Зарегистрируйтесь на ElephantSQL
- Перейдите: https://www.elephantsql.com/
- Создайте бесплатную базу (Tiny Turtle)
- Скопируйте URL подключения

### 2. Обновите backend/.env
```env
DATABASE_URL=postgres://ваш-url-от-elephantsql
```

### 3. Запустите
```bash
npm run dev
```

---

## 💻 Или установите PostgreSQL локально

### Windows:
1. Скачайте: https://www.postgresql.org/download/windows/
2. Установите (пароль: `postgres`, порт: `5432`)
3. Создайте БД `synergy_db`
4. Обновите `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/synergy_db
```

---

## 🚀 Команды

```bash
# Запуск с Docker
docker-compose up -d        # Запустить БД
npm run dev                 # Запустить приложение
docker-compose down         # Остановить БД

# Только приложение
cd backend && npm run dev   # Backend
cd frontend && npm run dev  # Frontend

# Или всё сразу
npm run dev                 # Из корня проекта
```

---

## 🎯 Первые шаги в приложении

1. **Регистрация** → Создайте аккаунт эксперта
2. **Профиль** → Заполните информацию и выберите тематики
3. **Создать статью** → Напишите первую статью
4. **Главная** → Посмотрите результат

---

## ❓ Частые вопросы

**Q: Docker не запускается**
A: Убедитесь что Docker Desktop запущен и виртуализация включена в BIOS

**Q: Порт 5432 занят**
A: У вас уже установлен PostgreSQL. Используйте его или остановите службу

**Q: Ошибка ETIMEDOUT**
A: Вы пытаетесь подключиться к Timeweb. Используйте локальную БД для разработки

---

## 📞 Нужна помощь?

1. Проверьте логи: `docker-compose logs` или `npm run dev`
2. Убедитесь что Docker запущен: `docker ps`
3. Проверьте .env файл в папке backend
