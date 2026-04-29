# Тестовая версия сайта — /test/

## Что сделано

Создана полная независимая копия фронтенда в директории `frontend-test/`.  
Тестовая версия доступна по адресу: **https://soulsynergy.ru/test/**

### Архитектура

```
soulsynergy.ru/        → frontend (основной, без изменений)
soulsynergy.ru/test/   → frontend-test (тестовая копия)
soulsynergy.ru/api/    → backend (общий для обоих)
```

- **frontend-test** — отдельный Docker-контейнер со своей сборкой
- Все правки в `frontend-test/src/` затрагивают ТОЛЬКО тестовую версию
- Основной сайт (`frontend/`) остаётся нетронутым
- Backend и база данных — общие (одна БД, один API)

### Структура файлов

```
synergy/
├── frontend/              ← Основной сайт (НЕ ТРОГАТЬ)
├── frontend-test/         ← Тестовая копия (РЕДАКТИРОВАТЬ ЗДЕСЬ)
│   ├── src/               ← Исходники (копия frontend/src)
│   ├── public/            ← Статика (копия frontend/public)
│   ├── vite.config.ts     ← base: '/test/'
│   ├── nginx.conf         ← Nginx конфигурация теста
│   ├── Dockerfile         ← Dockerfile теста
│   ├── package.json
│   ├── tsconfig.json
│   └── index.html         ← Заголовок: "ТЕСТ"
├── docker-compose.prod.yml ← Добавлен сервис frontend-test
└── frontend/nginx.conf     ← Добавлен proxy /test/ → frontend-test
```

### Изменённые файлы

| Файл | Что изменено |
|------|-------------|
| `frontend/nginx.conf` | Добавлен `location ^~ /test` → прокси на контейнер `frontend-test` |
| `docker-compose.prod.yml` | Добавлен сервис `frontend-test` |

### Ключевые различия frontend-test от frontend

| Параметр | frontend | frontend-test |
|----------|----------|--------------|
| `vite.config.ts` → base | `/` (по умолчанию) | `/test/` |
| `BrowserRouter` | `<BrowserRouter>` | `<BrowserRouter basename="/test">` |
| `<title>` | SoulSynergy — Синергия душ | SoulSynergy — ТЕСТ |
| Docker container | `synergy-frontend` | `synergy-frontend-test` |
| Порт | `8080:80` | нет (доступ через proxy) |

---

## Деплой на сервер

### 1. Загрузить файлы на сервер

Загрузите на сервер всю директорию `frontend-test/` и обновлённые файлы:

```bash
# Через git (рекомендуется)
git add frontend-test/
git add frontend/nginx.conf
git add docker-compose.prod.yml
git commit -m "Добавлена тестовая версия сайта /test/"
git push

# На сервере
cd /path/to/synergy
git pull
```

### 2. Пересобрать и запустить

```bash
# Пересобрать оба фронтенда и перезапустить
docker-compose -f docker-compose.prod.yml build frontend frontend-test
docker-compose -f docker-compose.prod.yml up -d frontend frontend-test
```

Или полная пересборка:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Проверить

```bash
# Проверить, что контейнеры работают
docker ps | grep frontend

# Должны быть:
# synergy-frontend       — основной сайт
# synergy-frontend-test  — тестовая версия
```

Откройте в браузере: `https://soulsynergy.ru/test/`

---

## Как вносить правки

1. Редактируйте файлы **только** в `frontend-test/src/`
2. Пересоберите тестовый контейнер:
   ```bash
   docker-compose -f docker-compose.prod.yml build frontend-test
   docker-compose -f docker-compose.prod.yml up -d frontend-test
   ```
3. Проверьте на `https://soulsynergy.ru/test/`
4. Основной сайт на `https://soulsynergy.ru/` **не затрагивается**

## Перенос верстки на основной сайт

Когда тестовая версия будет готова:

```bash
# Скопировать изменённые файлы из frontend-test в frontend
cp -r frontend-test/src/* frontend/src/

# Пересобрать основной фронтенд
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

> **Важно:** При переносе НЕ копируйте `vite.config.ts`, `nginx.conf`, `Dockerfile` и `index.html` — они содержат настройки для подраздела `/test/`.
