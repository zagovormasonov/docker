# Исправление ошибки 500 при создании платежа

## 🔍 Проблема
Ошибка `POST https://soulsynergy.ru/api/payments/create 500 (Internal Server Error)` при попытке создать платеж.

## ✅ Решение

### 1. Добавлены переменные Юкассы в docker-compose.prod.yml

В файл `docker-compose.prod.yml` добавлены переменные:
```yaml
# Юкасса настройки
YOOKASSA_SHOP_ID: ${YOOKASSA_SHOP_ID}
YOOKASSA_SECRET_KEY: ${YOOKASSA_SECRET_KEY}
```

### 2. Создайте таблицу платежей в базе данных

Выполните SQL скрипт в вашей базе данных PostgreSQL:

```sql
-- Создание таблицы для хранения информации о платежах
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    yookassa_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
```

### 3. Убедитесь, что в .env файле есть переменные

В корневом `.env` файле должны быть:
```env
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
FRONTEND_URL=https://soulsynergy.ru
```

### 4. Перезапустите Docker контейнеры

```bash
# Остановите контейнеры
docker-compose -f docker-compose.prod.yml down

# Пересоберите и запустите
docker-compose -f docker-compose.prod.yml up --build -d
```

### 5. Проверьте логи

```bash
# Проверьте логи backend
docker logs synergy-backend

# Проверьте логи в реальном времени
docker logs -f synergy-backend
```

## 🔧 Отладка

### Проверка переменных в контейнере:
```bash
docker exec synergy-backend env | grep YOOKASSA
```

### Проверка таблицы в базе данных:
```bash
docker exec -it synergy-postgres psql -U synergy -d synergy_db -c "\dt payments"
```

### Тестирование API:
```bash
curl -X POST https://soulsynergy.ru/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"yearly","amount":990,"description":"Тест"}'
```

## 📋 После исправления

1. ✅ Переменные Юкассы загружаются в контейнер
2. ✅ Таблица payments создана в БД
3. ✅ API платежей работает
4. ✅ Пользователи могут оплачивать подписку эксперта

## ⚠️ Важно

- Убедитесь, что используете правильные данные Юкассы (не тестовые в продакшене)
- Проверьте, что webhook URL настроен правильно: `https://soulsynergy.ru/api/payments/webhook`
- После изменений всегда перезапускайте контейнеры
