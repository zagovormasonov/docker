# Настройка на удаленном сервере

## 1. Создание таблицы products

Выполните на удаленном сервере:

```bash
# Подключитесь к контейнеру базы данных
docker exec -it synergy-db-1 psql -U postgres -d synergy

# Выполните SQL скрипт
\i /path/to/CREATE-PRODUCTS-TABLE.sql
```

Или выполните SQL напрямую:

```sql
-- Создание таблицы для готовых продуктов
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

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_products_expert_id ON products(expert_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
```

## 2. Перезапуск backend сервера

```bash
# Перезапустите backend контейнер
docker-compose restart backend

# Или пересоберите и перезапустите
docker-compose down
docker-compose up -d --build
```

## 3. Проверка логов

```bash
# Проверьте логи backend
docker-compose logs -f backend

# Проверьте логи базы данных
docker-compose logs -f db
```

## 4. Проверка статуса пользователя

Убедитесь, что ваш пользователь имеет тип 'expert':

```sql
-- Проверьте свой статус
SELECT id, email, name, user_type FROM users WHERE email = 'your-email@example.com';

-- Если нужно, обновите статус
UPDATE users SET user_type = 'expert' WHERE email = 'your-email@example.com';
```

## 5. Тестирование API

После выполнения всех шагов попробуйте снова добавить продукт через интерфейс.
