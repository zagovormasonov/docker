# Обновление социальных сетей в профиле

## Выполненные изменения

### 1. 🚫 Удаление Instagram
**Изменения в frontend:**
- Убрано поле `instagramUrl` из формы редактирования профиля (`ProfilePage.tsx`)
- Убрано отображение Instagram в профиле эксперта (`ExpertProfilePage.tsx`)
- Убрана проверка `expert.instagram_url` в условии отображения социальных сетей

**Изменения в backend:**
- Убрано поле `instagram_url` из SQL запросов в `users.ts` и `experts.ts`
- Убрано поле `instagramUrl` из API ответов
- Убрано поле `instagramUrl` из параметров обновления профиля

### 2. 🎨 Замена иконок социальных сетей
**Новые иконки:**
- **VK:** `/vk.png` (20x20px)
- **Telegram:** `/tg.png` (20x20px)  
- **WhatsApp:** `/wp.png` (20x20px)

**Изменения в отображении:**
```tsx
// Старый код с эмодзи
🟦 VK: {expert.vk_url}
✈️ Telegram: {expert.telegram_url}
📷 Instagram: {expert.instagram_url}
<PhoneOutlined /> WhatsApp: {expert.whatsapp}

// Новый код с кастомными иконками
<img src="/vk.png" alt="VK" style={{ width: 20, height: 20 }} />
VK: {expert.vk_url}

<img src="/tg.png" alt="Telegram" style={{ width: 20, height: 20 }} />
Telegram: {expert.telegram_url}

<img src="/wp.png" alt="WhatsApp" style={{ width: 20, height: 20 }} />
WhatsApp: {expert.whatsapp}
```

### 3. 📁 Файлы в папке public
**Проверенные файлы:**
- ✅ `vk.png` - иконка VK
- ✅ `tg.png` - иконка Telegram
- ✅ `wp.png` - иконка WhatsApp

### 4. 🗄️ Изменения в базе данных
**SQL скрипт для удаления колонки:**
```sql
-- REMOVE-INSTAGRAM-COLUMN.sql
ALTER TABLE users DROP COLUMN instagram_url;
```

**Проверка существования колонки:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('vk_url', 'telegram_url', 'whatsapp', 'instagram_url')
ORDER BY column_name;
```

## Технические детали

### Frontend изменения
1. **ProfilePage.tsx:**
   - Убрано поле `instagramUrl` из `form.setFieldsValue`
   - Убрано поле `instagramUrl` из формы редактирования
   - Убрано поле `instagramUrl` из `useEffect`

2. **ExpertProfilePage.tsx:**
   - Убрана проверка `expert.instagram_url` в условии отображения
   - Заменены эмодзи на кастомные изображения
   - Добавлены стили для выравнивания иконок

### Backend изменения
1. **users.ts:**
   - Убрано поле `instagram_url` из SELECT запроса
   - Убрано поле `instagramUrl` из объекта пользователя
   - Убрано поле `instagramUrl` из параметров обновления
   - Обновлены параметры SQL запроса UPDATE

2. **experts.ts:**
   - Убрано поле `instagram_url` из SELECT запроса
   - Убрано поле `instagramUrl` из параметров обновления
   - Обновлены параметры SQL запроса UPDATE

## Результат

### До изменений:
- ❌ Instagram отображался в профиле
- ❌ Эмодзи иконки социальных сетей
- ❌ Поле Instagram в форме редактирования

### После изменений:
- ✅ Instagram полностью удален
- ✅ Кастомные иконки для социальных сетей
- ✅ Чистый интерфейс без лишних полей
- ✅ Современный вид с профессиональными иконками

## Совместимость

- ✅ Обратная совместимость с существующими профилями
- ✅ Автоматическое удаление колонки `instagram_url` из базы данных
- ✅ Сохранение всех остальных социальных сетей
- ✅ Работа с существующими данными VK, Telegram, WhatsApp

## Файлы для выполнения миграции

1. **REMOVE-INSTAGRAM-COLUMN.sql** - SQL скрипт для удаления колонки
2. **vk.png, tg.png, wp.png** - иконки в папке `frontend/public/`

## Проверка

После применения изменений:
1. Instagram не отображается в профилях
2. Иконки социальных сетей загружаются корректно
3. Форма редактирования не содержит поле Instagram
4. API не возвращает поле `instagram_url`
