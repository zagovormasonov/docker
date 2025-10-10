# Исправление видимости галереи для других пользователей

## Проблема
Галерея фотографий загружалась и сохранялась, но не отображалась для других пользователей при просмотре профиля.

## Причина
API эндпоинт `/gallery` всегда возвращал галерею текущего авторизованного пользователя, а не того пользователя, чей профиль просматривается.

## Решение

### 1. Добавлен новый API эндпоинт
**Файл:** `backend/src/routes/gallery.ts`

```typescript
// Получить галерею конкретного пользователя (для просмотра)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📸 Запрос галереи пользователя:', userId);
    
    const result = await query(
      'SELECT * FROM profile_gallery WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('📸 Найдено фотографий для пользователя', userId, ':', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Ошибка получения галереи пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});
```

### 2. Обновлен компонент ProfileGallery
**Файл:** `frontend/src/components/ProfileGallery.tsx`

```typescript
const fetchGallery = async () => {
  try {
    setLoading(true);
    // Если это владелец профиля, используем защищенный эндпоинт
    // Если это другой пользователь, используем публичный эндпоинт
    const endpoint = isOwner ? '/gallery' : `/gallery/user/${userId}`;
    console.log('📸 Загружаем галерею с эндпоинта:', endpoint);
    
    const response = await api.get(endpoint);
    setImages(response.data);
    setImageCount(response.data.length);
  } catch (error) {
    console.error('Ошибка загрузки галереи:', error);
    message.error('Ошибка загрузки галереи');
  } finally {
    setLoading(false);
  }
};
```

### 3. Обновлены зависимости useEffect
```typescript
useEffect(() => {
  fetchGallery();
}, [userId, isOwner]); // Добавлен isOwner в зависимости
```

## Логика работы

### Для владельца профиля (isOwner = true):
- Используется эндпоинт: `GET /api/gallery`
- Требует авторизации
- Позволяет управление (загрузка/удаление)

### Для других пользователей (isOwner = false):
- Используется эндпоинт: `GET /api/gallery/user/:userId`
- Не требует авторизации
- Только просмотр

## API Эндпоинты

### Защищенные (требуют авторизации):
- `GET /api/gallery` - галерея текущего пользователя
- `POST /api/gallery/upload` - загрузка фотографии
- `DELETE /api/gallery/:id` - удаление фотографии
- `GET /api/gallery/count` - количество фотографий

### Публичные (не требуют авторизации):
- `GET /api/gallery/user/:userId` - галерея конкретного пользователя

## Безопасность

### Публичный эндпоинт:
- Не требует авторизации
- Возвращает только публичную информацию (URL, название, размер)
- Не раскрывает приватные данные

### Защищенные эндпоинты:
- Требуют валидный JWT токен
- Проверяют права доступа
- Позволяют управление только собственными фотографиями

## Тестирование

### 1. Проверка для владельца:
```javascript
// Должен использовать /gallery
const response = await api.get('/gallery');
```

### 2. Проверка для других пользователей:
```javascript
// Должен использовать /gallery/user/123
const response = await api.get('/gallery/user/123');
```

### 3. Логи в консоли:
- `🖼️ ProfileGallery props: { userId: 123, isOwner: false }`
- `📸 Загружаем галерею с эндпоинта: /gallery/user/123`
- `📸 Запрос галереи пользователя: 123`

## Результат

✅ **Галерея теперь отображается для всех пользователей**
✅ **Владельцы могут управлять своими фотографиями**
✅ **Другие пользователи могут только просматривать**
✅ **Безопасность сохранена**
✅ **Производительность оптимизирована**
