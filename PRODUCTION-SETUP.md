# 🚀 Настройка продакшена

## 📋 Переменные окружения для продакшена

Создайте файл `.env.prod` в корне проекта со следующими переменными:

```env
# База данных
DB_PASSWORD=your_secure_database_password_here

# JWT секрет (обязательно измените!)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# EmailJS настройки (опционально)
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_MODERATION_TEMPLATE_ID=your_moderation_template_id

# Telegram Bot настройки (опционально)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

## 🔧 Запуск продакшена

```bash
# Запуск с переменными из .env.prod
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Или с переменными окружения
TELEGRAM_ENABLED=true TELEGRAM_BOT_TOKEN=your_token TELEGRAM_CHAT_ID=your_chat_id docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 Настройка Telegram поддержки

### 1. Создайте Telegram бота
- Найдите @BotFather в Telegram
- Отправьте `/newbot`
- Следуйте инструкциям
- Скопируйте токен

### 2. Получите Chat ID
- Добавьте бота в группу или начните диалог
- Отправьте любое сообщение
- Перейдите: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
- Найдите `"chat":{"id":` - это ваш Chat ID

### 3. Настройте переменные
```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
```

## ✅ Проверка работы

1. Запустите продакшен
2. Откройте сайт
3. Нажмите кнопку поддержки
4. Отправьте тестовое сообщение
5. Проверьте, что сообщение пришло в Telegram

## 🔒 Безопасность

- Используйте сильные пароли
- Не коммитьте `.env.prod` в репозиторий
- Регулярно обновляйте JWT_SECRET
- Используйте HTTPS в продакшене
