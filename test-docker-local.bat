@echo off
echo ==========================================
echo   ТЕСТ DOCKER СБОРКИ ЛОКАЛЬНО
echo ==========================================
echo.
echo Это протестирует Docker сборку локально
echo перед деплоем на сервер.
echo.
pause

echo.
echo [1/3] Останавливаем локальный dev сервер...
docker compose -f docker-compose.yml down 2>nul

echo.
echo [2/3] Собираем production образы...
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo.
echo [3/3] Запускаем production версию...
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo.
echo ==========================================
echo   ГОТОВО!
echo ==========================================
echo.
echo Откройте браузер: http://localhost
echo.
echo Для просмотра логов:
echo   docker compose -f docker-compose.prod.yml logs -f
echo.
echo Для остановки:
echo   docker compose -f docker-compose.prod.yml down
echo.
pause
