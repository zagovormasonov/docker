# Отладка авторизации на удаленном сервере

## 1. Перезапуск backend с новыми изменениями

```bash
# На удаленном сервере
docker-compose restart backend
```

## 2. Тестирование авторизации

После перезапуска протестируйте следующие endpoints:

### Тест 1: Проверка аутентификации
```
GET https://soulsynergy.ru/api/test/test-auth
Authorization: Bearer YOUR_JWT_TOKEN
```

**Ожидаемый ответ:**
```json
{
  "message": "Аутентификация работает",
  "userId": 123,
  "userType": "expert"
}
```

### Тест 2: Проверка прав эксперта
```
GET https://soulsynergy.ru/api/test/test-expert
Authorization: Bearer YOUR_JWT_TOKEN
```

**Ожидаемый ответ:**
```json
{
  "message": "Права эксперта подтверждены",
  "userId": 123,
  "userType": "expert"
}
```

## 3. Проверка логов backend

```bash
# Смотрите логи в реальном времени
docker-compose logs -f backend
```

**Что искать в логах:**
- `🔑 Проверка токена аутентификации`
- `✅ Токен валиден, пользователь: X, тип: expert`
- `🔍 Проверка прав эксперта для пользователя: X, тип: expert`
- `✅ Пользователь подтвержден как эксперт`

## 4. Проверка статуса пользователя в БД

```bash
# Подключитесь к БД
docker exec -it synergy-db-1 psql -U postgres -d synergy

# Проверьте свой статус
SELECT id, email, name, user_type FROM users WHERE email = 'ваш-email';

# Если user_type не 'expert', обновите:
UPDATE users SET user_type = 'expert' WHERE email = 'ваш-email';
```

## 5. Создание таблицы products (если не создана)

```sql
-- В psql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  expert_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2),
  product_type VARCHAR(50) CHECK (product_type IN ('digital', 'physical', 'service')),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_expert_id ON products(expert_id);
```

## 6. Тестирование создания продукта

После выполнения всех шагов попробуйте снова добавить продукт через интерфейс.

**Если все еще ошибка 403:**
1. Проверьте логи backend - там будет видно, на каком этапе происходит ошибка
2. Убедитесь, что JWT токен содержит правильный userType
3. Проверьте, что в БД ваш user_type = 'expert'
