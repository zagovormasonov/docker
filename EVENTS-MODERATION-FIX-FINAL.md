# 🔧 Финальное исправление модерации событий

## 🚨 **Проблема найдена!**

### **Анализ данных с `/api/moderation/check-fields`:**

```json
{
  "eventsFields": [
    {"column_name": "moderated_at", "data_type": "timestamp without time zone"},
    {"column_name": "moderated_by", "data_type": "integer"},
    {"column_name": "moderation_status", "data_type": "character varying"}
  ],
  "articlesFields": [
    {"column_name": "is_published", "data_type": "boolean"},
    {"column_name": "moderated_by", "data_type": "integer"},
    {"column_name": "moderated_at", "data_type": "timestamp without time zone"},
    {"column_name": "moderation_status", "data_type": "character varying"}
  ],
  "pendingEvents": "6",
  "pendingArticles": "0"
}
```

### **❌ Проблема:**
В таблице `events` **отсутствует поле `is_published`**!

- ✅ **Articles**: есть `is_published`
- ❌ **Events**: НЕТ `is_published`

## 🔧 **Решение:**

### **1. Добавить поле `is_published` в таблицу `events`:**

```sql
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
```

### **2. Обновить существующие события:**

```sql
UPDATE events 
SET is_published = true 
WHERE moderation_status = 'approved' OR moderation_status IS NULL;
```

### **3. Проверить результат:**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at');
```

## 🧪 **Как исправить:**

### **Вариант 1: Через pgAdmin (рекомендуется)**
1. **Откройте pgAdmin** на `https://soulsynergy.ru:8081`
2. **Подключитесь к базе данных** `synergy_db`
3. **Выполните SQL запросы** из файла `FIX-EVENTS-PUBLISHED.sql`

### **Вариант 2: Через командную строку**
```bash
# Подключитесь к контейнеру PostgreSQL
docker exec -it synergy-postgres psql -U synergy -d synergy_db

# Выполните SQL команды
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
UPDATE events SET is_published = true WHERE moderation_status = 'approved' OR moderation_status IS NULL;
```

### **Вариант 3: Через API (если сервер перезапустится)**
```bash
curl "https://soulsynergy.ru/api/moderation/fix-events-published"
```

## 📊 **Ожидаемый результат:**

После исправления в таблице `events` должны быть поля:
- ✅ `moderation_status`
- ✅ `is_published` ← **ДОБАВИТЬ**
- ✅ `moderated_by`
- ✅ `moderated_at`

## 🎯 **Статус:**

- ✅ **Поля модерации** - активированы
- ✅ **События на модерацию** - 6 штук
- ❌ **Поле `is_published`** - отсутствует в events
- 🔧 **Требуется исправление** - добавить поле

## 🚀 **После исправления:**

Модерация событий должна работать без ошибок 500! 🎉
