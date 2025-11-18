@echo off
REM ===================================
REM Скрипт настройки нового Email сервиса
REM service_22cecl9
REM ===================================

echo.
echo ========================================
echo   Настройка Email сервиса service_22cecl9
echo ========================================
echo.

REM Проверка существования шаблонов
if not exist "frontend\env.example" (
    echo [ОШИБКА] Файл frontend\env.example не найден!
    pause
    exit /b 1
)

if not exist "env.prod.example" (
    echo [ОШИБКА] Файл env.prod.example не найден!
    pause
    exit /b 1
)

echo Выберите вариант настройки:
echo.
echo 1. Локальная разработка (создать frontend\.env)
echo 2. Продакшн Docker (создать .env.prod)
echo 3. Оба варианта
echo 4. Выход
echo.

set /p choice="Ваш выбор (1-4): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto both
if "%choice%"=="4" goto end

echo Неверный выбор!
pause
exit /b 1

:local
echo.
echo [1/2] Создание frontend\.env...
if exist "frontend\.env" (
    echo [!] Файл frontend\.env уже существует!
    set /p overwrite="Перезаписать? (y/n): "
    if not "%overwrite%"=="y" goto skip_local
)
copy "frontend\env.example" "frontend\.env" >nul
echo [OK] Файл frontend\.env создан
echo.
echo [2/2] Следующие шаги:
echo   1. Откройте frontend\.env
echo   2. Замените all значения your_* на реальные
echo   3. Service ID уже установлен: service_22cecl9
echo   4. Запустите: cd frontend ^&^& npm run dev
echo.
:skip_local
if "%choice%"=="1" goto end
if "%choice%"=="3" goto prod

:prod
echo.
echo [1/2] Создание .env.prod...
if exist ".env.prod" (
    echo [!] Файл .env.prod уже существует!
    set /p overwrite="Перезаписать? (y/n): "
    if not "%overwrite%"=="y" goto skip_prod
)
copy "env.prod.example" ".env.prod" >nul
echo [OK] Файл .env.prod создан
echo.
echo [2/2] Следующие шаги:
echo   1. Откройте .env.prod
echo   2. Замените ВСЕ значения your_* на реальные
echo   3. Service ID уже установлен: service_22cecl9
echo   4. Запустите Docker:
echo      docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
echo.
:skip_prod
goto end

:both
call :local
call :prod
goto end

:end
echo.
echo ========================================
echo   Настройка завершена!
echo ========================================
echo.
echo Дополнительная информация:
echo   - Быстрый старт: QUICK-START-NEW-EMAIL-SERVICE.md
echo   - Подробная инструкция: ОБНОВЛЕНИЕ-EMAIL-СЕРВИСА.md
echo   - Полная документация: EMAILJS-SERVICE-UPDATE.md
echo.
pause





