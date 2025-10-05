# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ: Одобрение событий не работает

## 🔍 **Точная ошибка:**
```json
{
  "error": "Ошибка тестирования одобрения",
  "message": "column \"is_published\" does not exist",
  "timestamp": "2025-10-05T05:20:34.954Z"
}
```

## ❌ **Проблема:**
Поле `is_published` не существует в таблице `events`, поэтому одобрение событий не работает.

## 🔧 **СРОЧНОЕ РЕШЕНИЕ:**

### **1. Перезапустите сервер:**
```bash
# На сервере выполните:
docker-compose restart backend
```

### **2. После перезапуска добавьте поле:**
```bash
curl "https://soulsynergy.ru/api/moderation/force-add-published"
```

### **3. Проверьте результат:**
```bash
curl "https://soulsynergy.ru/api/moderation/check-fields"
```

## 🧪 **Альтернативное решение через SQL:**

Если endpoints не работают, выполните SQL напрямую:

### **1. Подключитесь к базе данных:**
```bash
docker exec -it synergy-postgres psql -U synergy -d synergy_db
```

### **2. Выполните SQL команды:**
```sql
-- Добавляем поле is_published
ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT false;

-- Обновляем существующие события
UPDATE events SET is_published = true WHERE moderation_status = 'approved' OR moderation_status IS NULL;

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('moderation_status', 'is_published', 'moderated_by', 'moderated_at')
ORDER BY column_name;
```

### **3. Выйдите из PostgreSQL:**
```sql
\q
```

## 📱 **Ожидаемый результат:**

После добавления поля в таблице `events` должны быть поля:
- ✅ `moderation_status`
- ✅ `is_published` ← **ДОБАВИТЬ**
- ✅ `moderated_by`
- ✅ `moderated_at`

## 🧪 **Проверка:**

### **1. Проверьте поля модерации:**
```bash
curl "https://soulsynergy.ru/api/moderation/check-fields"
```

**Ожидаемый результат:**
```json
{
  "eventsFields": [
    {"column_name": "is_published", "data_type": "boolean"},
    {"column_name": "moderated_at", "data_type": "timestamp without time zone"},
    {"column_name": "moderated_by", "data_type": "integer"},
    {"column_name": "moderation_status", "data_type": "character varying"}
  ]
}
```

### **2. Протестируйте одобрение:**
```bash
curl "https://soulsynergy.ru/api/moderation/test-approve-simple/9"
```

**Ожидаемый результат:**
```json
{
  "message": "Простой тест одобрения события",
  "debug": {
    "eventId": "9",
    "event": {
      "id": 9,
      "title": "Название события",
      "organizer_id": 8,
      "is_published": false,
      "moderation_status": "pending"
    },
    "timestamp": "2025-01-05T05:20:00.000Z"
  }
}
```

## 🎯 **Статус:**

- ❌ **Поле `is_published`** - не существует в таблице `events`
- ❌ **Одобрение событий** - не работает
- 🔧 **Требуется срочное исправление** - добавить поле в БД

## 🚀 **Следующие шаги:**

1. **Перезапустите сервер** - `docker-compose restart backend`
2. **Добавьте поле через endpoint** - `/api/moderation/force-add-published`
3. **Или добавьте через SQL** - `ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT false;`
4. **Проверьте результат** - должно быть поле `is_published`
5. **Попробуйте одобрить событие** - должно работать

## 🎉 **После исправления:**

Модерация событий должна работать без ошибок! 🚀
