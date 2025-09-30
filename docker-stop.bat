@echo off
echo Останавливаем Synergy...
docker compose -f docker-compose.prod.yml --env-file .env.production down
echo Готово!
