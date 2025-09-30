@echo off
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
