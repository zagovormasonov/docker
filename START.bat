@echo off
echo ==========================================
echo   ЗАПУСК SYNERGY PLATFORM
echo ==========================================
echo.
echo Проверка Docker PostgreSQL...
docker ps | findstr synergy-postgres
if errorlevel 1 (
    echo [!] PostgreSQL не запущен. Запускаем...
    docker-compose up -d
    timeout /t 5 /nobreak
) else (
    echo [✓] PostgreSQL уже запущен
)
echo.
echo Запуск приложения...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
npm run dev
