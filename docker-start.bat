@echo off
echo ==========================================
echo   ЗАПУСК SYNERGY В DOCKER
echo ==========================================
echo.

REM Останавливаем старые контейнеры
echo [1/4] Останавливаем старые контейнеры...
docker compose -f docker-compose.prod.yml --env-file .env.production down

echo.
echo [2/4] Собираем образы (может занять несколько минут)...
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo.
echo [3/4] Запускаем контейнеры...
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo.
echo [4/4] Проверяем статус...
timeout /t 10 /nobreak >nul
docker compose -f docker-compose.prod.yml ps

echo.
echo ==========================================
echo   ГОТОВО!
echo ==========================================
echo.
echo Приложение доступно на: http://localhost
echo.
echo Для просмотра логов:
echo   docker compose -f docker-compose.prod.yml logs -f
echo.
echo Для остановки:
echo   docker compose -f docker-compose.prod.yml down
echo.
pause
