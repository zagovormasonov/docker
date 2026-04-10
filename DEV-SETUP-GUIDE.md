# Dev Server Setup

This project already contains a dedicated Docker stack for a development copy of the site.

Target URL:
- `https://dev.soulsynergy.ru`

Isolation rules:
- Frontend runs in a separate container on host port `8081`
- Backend runs in a separate container and talks only to `synergy_db_dev`
- PostgreSQL data is stored in the dedicated Docker volume `postgres_data_dev`
- The dev stack does not reuse the production database

## 1. Prepare environment

Use the root file `.env.dev`.

Important variables:
- `FRONTEND_URL_DEV=https://dev.soulsynergy.ru`
- `VITE_PUBLIC_APP_URL=https://dev.soulsynergy.ru`
- `DB_PASSWORD=...`

If you want test integrations instead of production ones, set:
- `YOOKASSA_SHOP_ID_DEV`
- `YOOKASSA_SECRET_KEY_DEV`

## 2. Start the dev stack

```powershell
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
```

Stop it:

```powershell
docker compose -f docker-compose.dev.yml --env-file .env.dev down
```

If you need a fully clean empty dev database:

```powershell
docker compose -f docker-compose.dev.yml --env-file .env.dev down -v
```

## 3. Point the domain to the server

DNS for `dev.soulsynergy.ru` must point to the same host where Docker is running.

## 4. Configure host Nginx

Use the host-level config from:
- `deploy/nginx/dev.soulsynergy.ru.conf`

It proxies the public domain to local port `8081`, which is the dev frontend container.

## 5. Enable HTTPS

Example with Certbot:

```powershell
certbot --nginx -d dev.soulsynergy.ru
```

## Notes

- Basic Auth is enabled inside the dev frontend container via `frontend/.htpasswd`
- Uploaded files are isolated in the Docker volume `uploads_data_dev`
- Registration emails inside dev use `VITE_PUBLIC_APP_URL`, so links will point to `https://dev.soulsynergy.ru`
