# 🔧 Настройка системы модерации

## 📋 Пошаговая инструкция

### 1. Сделать пользователя администратором

Выполните в базе данных:

```sql
-- Сделать пользователя samyrize77777@gmail.com администратором
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'samyrize77777@gmail.com';

-- Проверить результат
SELECT id, name, email, user_type 
FROM users 
WHERE email = 'samyrize77777@gmail.com';
```

### 2. Настроить поля модерации в базе данных

Выполните SQL скрипт из файла `MODERATION-SETUP-SQL.sql`:

```sql
-- Добавляем поля модерации в таблицу articles
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Добавляем поля модерации в таблицу events  
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Создаем таблицу для уведомлений модерации
CREATE TABLE IF NOT EXISTS moderation_notifications (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(20) NOT NULL, -- 'article' или 'event'
  content_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_articles_moderation_status ON articles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_events_moderation_status ON events(moderation_status);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_status ON moderation_notifications(status);
```

### 3. Перезапустить backend сервер

```bash
cd backend
npm run dev
```

### 4. Проверить работу системы

1. **Войдите как администратор** (`samyrize77777@gmail.com`)
2. **Проверьте меню** - должна появиться ссылка "Модерация"
3. **Создайте статью/событие** с другого аккаунта
4. **Проверьте чат** - должно прийти уведомление администратору
5. **Перейдите в модерацию** - должен появиться контент на модерацию

## 🔍 Отладка проблем

### Проблема: Не отображается раздел "Модерация"

**Решение:**
1. Проверьте в консоли браузера отладочную информацию:
   ```
   Header - user: {userType: 'admin', ...}
   Header - isAdmin: true
   ```
2. Убедитесь, что `userType === 'admin'` в базе данных
3. Перезагрузите страницу после изменения типа пользователя

### Проблема: Ошибка сервера при создании статьи

**Решение:**
1. Выполните SQL скрипт настройки полей модерации
2. Перезапустите backend сервер
3. Проверьте логи сервера на наличие ошибок

### Проблема: Не приходят уведомления в чат

**Решение:**
1. Убедитесь, что пользователь `samyrize77777@gmail.com` существует и имеет тип `admin`
2. Проверьте, что поля модерации созданы в базе данных
3. Проверьте логи сервера на ошибки отправки уведомлений

## 📱 Как работает система

### Для пользователей:
1. **Создают статью/событие** → получают уведомление "Статья отправлена на модерацию"
2. **Ждут одобрения** → получают уведомление в чате о результате
3. **При одобрении** → контент публикуется
4. **При отклонении** → получают причину отклонения

### Для администратора:
1. **Получает уведомления** в чате о новом контенте
2. **Переходит в "Модерация"** для просмотра
3. **Одобряет/отклоняет** контент
4. **Автоматически отправляет** уведомления авторам

## 🎯 API Endpoints

- `GET /api/moderation/articles` - статьи на модерацию
- `GET /api/moderation/events` - события на модерацию  
- `POST /api/moderation/articles/:id/approve` - одобрить статью
- `POST /api/moderation/articles/:id/reject` - отклонить статью
- `POST /api/moderation/events/:id/approve` - одобрить событие
- `POST /api/moderation/events/:id/reject` - отклонить событие

## 🔐 Безопасность

- Доступ к модерации только для `userType === 'admin'`
- Валидация причин отклонения (обязательное поле)
- Автоматическое создание чатов с администратором
- Real-time уведомления через существующую систему чатов
