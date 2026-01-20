# Доступ к базе данных (GUI)

Для управления базой данных PostgreSQL вы можете использовать один из двух установленных инструментов:

## 1. Adminer (Легкий и быстрый)
**Адрес:** [http://localhost:8082](http://localhost:8082)

**Данные для входа:**
- **System:** PostgreSQL
- **Server:** `postgres` (имя сервиса в Docker)
- **Username:** `synergy`
- **Password:** `synergy123` (или пароль из `.env.production`)
- **Database:** `synergy_db`

Adminer — очень простой инструмент, который не требует предварительной настройки серверов.

---

## 2. pgAdmin 4 (Мощный и функциональный)
**Адрес:** [http://localhost:8081](http://localhost:8081) (или 5050 в prod)

**Данные для входа в интерфейс:**
- **Email:** `admin@soulsynergy.ru` (или `admin@example.com`)
- **Password:** `admin123`

**Для подключения к базе внутри pgAdmin:**
1. Нажмите "Add New Server"
2. На вкладке **General**: Name = `Synergy DB`
3. На вкладке **Connection**:
   - **Host name/address:** `postgres`
   - **Port:** `5432`
   - **Maintenance database:** `synergy_db`
   - **Username:** `synergy`
   - **Password:** `synergy123` (или пароль из `.env.production`)
4. Нажмите **Save**.

---

## Как запустить?
Если вы используете Docker, просто запустите проект как обычно:
```bash
docker compose up -d
```
Или используйте соответствующие `.bat` файлы в корне проекта.
