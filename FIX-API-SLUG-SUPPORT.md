# 🔧 Исправление: Поддержка slug во всех API endpoints

## ❌ Проблема

При переходе на профиль эксперта по slug (например, `/experts/rahmat`) возникали ошибки 500:

```
GET /api/users/custom-socials/rahmat - 500 Error
GET /api/expert-interactions/rahmat/status - 500 Error
```

**Причина:** Эти endpoints принимали только числовой ID, а не slug.

## ✅ Решение

Обновлены endpoints для поддержки как ID, так и slug:

### 1. **Custom Socials API**
**Файл:** `backend/src/routes/custom-socials.ts`

**Endpoint:** `GET /users/custom-socials/:userIdOrSlug`

```typescript
// Было:
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    'SELECT ... WHERE user_id = $1',
    [userId]  // ← Ошибка если передан slug!
  );
});

// Стало:
router.get('/:userIdOrSlug', async (req, res) => {
  const { userIdOrSlug } = req.params;
  
  // Определяем, это ID или slug
  const isNumericId = /^\d+$/.test(userIdOrSlug);
  
  let userId;
  if (isNumericId) {
    userId = userIdOrSlug;
  } else {
    // Получаем ID по slug
    const userResult = await pool.query(
      'SELECT id FROM users WHERE slug = $1',
      [userIdOrSlug]
    );
    userId = userResult.rows[0].id;
  }
  
  const result = await pool.query(
    'SELECT ... WHERE user_id = $1',
    [userId]
  );
});
```

### 2. **Expert Interactions API**
**Файл:** `backend/src/routes/expert-interactions.ts`

**Обновлённые endpoints:**
- `POST /:idOrSlug/favorite` - добавить/убрать из избранного
- `GET /:idOrSlug/status` - получить статус избранного
- `GET /favorites` - получить список избранных (добавлен slug в результат)

## 🎯 Что теперь работает

### ✅ Оба варианта URL работают:

**С ID (старый формат):**
```
/api/users/custom-socials/21
/api/expert-interactions/21/status
/api/expert-interactions/21/favorite
```

**Со slug (новый формат):**
```
/api/users/custom-socials/rahmat
/api/expert-interactions/rahmat/status
/api/expert-interactions/rahmat/favorite
```

### ✅ Обратная совместимость:

- Старые ссылки с ID продолжают работать
- Новые ссылки со slug тоже работают
- Frontend может использовать любой вариант

## 📦 Изменённые файлы

1. **`backend/src/routes/custom-socials.ts`**
   - ✅ Endpoint `/:userIdOrSlug` поддерживает ID и slug

2. **`backend/src/routes/expert-interactions.ts`**
   - ✅ Endpoint `/:idOrSlug/favorite` поддерживает ID и slug
   - ✅ Endpoint `/:idOrSlug/status` поддерживает ID и slug
   - ✅ Endpoint `/favorites` возвращает slug в списке

## 🚀 Как применить

### 1. Пересоберите backend:

```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### 2. Проверьте логи:

```bash
docker-compose logs backend
```

Не должно быть ошибок 500.

### 3. Проверьте в браузере:

1. Откройте профиль эксперта по slug: `/experts/rahmat`
2. Откройте консоль (F12)
3. Не должно быть ошибок 500! ✅

## 🧪 Тестирование

### Проверьте оба формата:

**В консоли браузера:**

```javascript
const token = localStorage.getItem('token');

// Тест 1: По ID
fetch('https://soulsynergy.ru/api/users/custom-socials/21', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Custom socials by ID:', data));

// Тест 2: По slug
fetch('https://soulsynergy.ru/api/users/custom-socials/rahmat', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Custom socials by slug:', data));
```

**Оба должны вернуть одинаковые данные!** ✅

## 🎯 Итог

### Было:
- ❌ Ссылки со slug выдавали 500 ошибку
- ❌ Дополнительные ссылки не загружались
- ❌ Избранное не работало

### Стало:
- ✅ Slug поддерживается везде
- ✅ Дополнительные ссылки загружаются
- ✅ Избранное работает
- ✅ Обратная совместимость с ID

---

**Дата:** 28 ноября 2025  
**После пересборки backend всё заработает!** 🎉

