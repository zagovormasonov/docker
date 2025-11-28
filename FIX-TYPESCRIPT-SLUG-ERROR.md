# 🔧 Исправление ошибки TypeScript при сборке

## ❌ Проблема

При сборке Docker-образа frontend выдавал ошибки TypeScript:

```
error TS2339: Property 'slug' does not exist on type 'Expert'.
error TS2339: Property 'slug' does not exist on type 'User'.
```

## ✅ Решение

Добавлено поле `slug?: string;` в интерфейсы TypeScript.

### Обновлённые файлы:

1. **`frontend/src/contexts/AuthContext.tsx`**
   - Добавлено `slug?: string;` в интерфейс `User`

2. **`frontend/src/pages/FavoritesPage.tsx`**
   - Добавлено `slug?: string;` в интерфейс `Expert`

3. **`frontend/src/pages/AdminPanel.tsx`**
   - Добавлено `slug?: string;` в интерфейс `User`

4. **`frontend/src/pages/ExpertsPage.tsx`**
   - Уже было добавлено ранее ✅

## 🚀 Теперь можно собирать Docker

```bash
docker-compose up --build
```

Сборка должна пройти успешно! ✅

---

**Дата:** 28 ноября 2025

