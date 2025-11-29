@echo off
REM =============================================
REM Проверка автоматического назначения экспертов
REM =============================================

echo.
echo ========================================
echo Проверка платежей и статусов экспертов
echo ========================================
echo.

REM Проверяем, что указаны переменные окружения
if "%DB_NAME%"=="" (
    echo [ОШИБКА] Переменная DB_NAME не установлена
    echo Установите переменные окружения или отредактируйте этот скрипт
    echo.
    set /p DB_NAME="Введите имя базы данных: "
)

if "%DB_USER%"=="" (
    set /p DB_USER="Введите имя пользователя БД (по умолчанию postgres): "
    if "%DB_USER%"=="" set DB_USER=postgres
)

echo.
echo Подключение к базе данных: %DB_NAME%
echo Пользователь: %DB_USER%
echo.

REM Выполняем SQL скрипт
psql -U %DB_USER% -d %DB_NAME% -f FIX-PAYMENTS-AUTO-EXPERT.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ОШИБКА] Не удалось выполнить SQL скрипт
    echo Проверьте:
    echo - Установлен ли PostgreSQL
    echo - Правильно ли указаны DB_NAME и DB_USER
    echo - Есть ли файл FIX-PAYMENTS-AUTO-EXPERT.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Проверка завершена
echo ========================================
echo.
echo Если скрипт показал проблемные платежи:
echo 1. Откройте файл FIX-PAYMENTS-AUTO-EXPERT.sql
echo 2. Раскомментируйте блок DO $$ (строки 61-97)
echo 3. Запустите этот скрипт снова
echo.
echo Для перезапуска backend выполните:
echo   docker-compose restart backend
echo.
pause

