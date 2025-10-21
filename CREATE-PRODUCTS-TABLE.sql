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

-- Добавляем комментарии к таблице
COMMENT ON TABLE products IS 'Таблица готовых продуктов экспертов';
COMMENT ON COLUMN products.expert_id IS 'ID эксперта-владельца продукта';
COMMENT ON COLUMN products.title IS 'Название продукта';
COMMENT ON COLUMN products.description IS 'Описание продукта';
COMMENT ON COLUMN products.price IS 'Цена продукта в рублях';
COMMENT ON COLUMN products.product_type IS 'Тип продукта: digital (цифровой), physical (физический), service (услуга)';
COMMENT ON COLUMN products.image_url IS 'URL изображения продукта';
