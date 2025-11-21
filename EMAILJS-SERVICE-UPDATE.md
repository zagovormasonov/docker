# 📧 Обновление EmailJS Service до service_22cecl9

## ✅ Что было сделано

Обновлены файлы конфигурации для использования нового сервиса EmailJS с ID `service_22cecl9`:
- ✅ `ENV-EXAMPLE.txt` - обновлен пример конфигурации
- ✅ `PRODUCTION-SETUP.md` - обновлена документация продакшена

## 🔧 Что нужно сделать вам

### Вариант 1: Локальная разработка (Development)

1. **Создайте файл `.env` в корне проекта** (если его нет):

```env
# База данных
DATABASE_URL=postgresql://username:password@localhost:5432/synergy

# JWT
JWT_SECRET=your_jwt_secret_key

# Email (EmailJS) - НОВЫЙ СЕРВИС
VITE_EMAILJS_SERVICE_ID=service_22cecl9
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=your_verification_template_id
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=your_reset_password_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Юкасса
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Порт сервера
PORT=3001
```

2. **Создайте файл `.env` в папке `frontend/`** (если его нет):

```env
VITE_EMAILJS_SERVICE_ID=service_22cecl9
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=your_verification_template_id
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=your_reset_password_template_id
VITE_EMAILJS_MODERATION_TEMPLATE_ID=your_moderation_template_id
```

3. **Замените значения:**
   - `your_emailjs_public_key` - ваш публичный ключ EmailJS
   - `your_verification_template_id` - ID шаблона для подтверждения email (остается прежним)
   - `your_reset_password_template_id` - ID шаблона для восстановления пароля (остается прежним)
   - `your_moderation_template_id` - ID шаблона для модерации (остается прежним)

### Вариант 2: Продакшн (Production) с Docker

1. **Создайте или обновите файл `.env.prod` в корне проекта:**

```env
# База данных
DB_PASSWORD=your_secure_database_password_here

# JWT секрет (обязательно измените!)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# EmailJS настройки - НОВЫЙ СЕРВИС service_22cecl9
VITE_EMAILJS_SERVICE_ID=service_22cecl9
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=your_verification_template_id
VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=your_reset_password_template_id
VITE_EMAILJS_MODERATION_TEMPLATE_ID=your_moderation_template_id

# EmailJS для backend
EMAILJS_SERVICE_ID=service_22cecl9
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_MODERATION_TEMPLATE_ID=your_moderation_template_id

# Юкасса
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Telegram Bot настройки (опционально)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

2. **Пересоберите и перезапустите Docker контейнеры:**

```bash
# Остановите контейнеры
docker-compose -f docker-compose.prod.yml down

# Пересоберите с новыми переменными
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

# Запустите заново
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 📝 Важные замечания

1. **ID шаблонов остаются прежними** - меняется только Service ID на `service_22cecl9`
2. **Переменные VITE_*** используются для фронтенда (они встраиваются в код при сборке)
3. **Переменные без VITE_** используются для бэкенда
4. **После обновления переменных в .env нужно перезапустить сервер**
5. **После обновления переменных для Docker нужно пересобрать образы**

## 🧪 Проверка работы

После обновления конфигурации проверьте:

1. **Регистрация нового пользователя:**
   - Попробуйте зарегистрироваться с новым email
   - Проверьте, что письмо подтверждения приходит

2. **Восстановление пароля:**
   - Попробуйте восстановить пароль
   - Проверьте, что письмо с инструкциями приходит

## ❓ Где используется новый сервис

Новый сервис `service_22cecl9` будет использоваться в:
- ✅ `frontend/src/pages/RegisterPage.tsx` - регистрация новых пользователей (строка 21)
- ✅ `frontend/src/pages/ForgotPasswordPage.tsx` - восстановление пароля (строка 19)

## 🔍 Проверка текущих настроек

Вы можете проверить, какие переменные сейчас установлены:

**Для локальной разработки:**
```bash
# В корне проекта
cat .env

# Во frontend
cat frontend/.env
```

**Для Docker:**
```bash
# Проверка переменных в контейнере frontend
docker exec synergy-frontend env | grep VITE_EMAILJS

# Проверка переменных в контейнере backend
docker exec synergy-backend env | grep EMAILJS
```

## 🆘 Если что-то не работает

1. Убедитесь, что файлы `.env` созданы в правильных местах
2. Проверьте, что все значения заменены (нет `your_...`)
3. Перезапустите сервер разработки или пересоберите Docker
4. Проверьте логи:
   ```bash
   # Локально
   npm run dev
   
   # Docker
   docker-compose -f docker-compose.prod.yml logs -f
   ```






