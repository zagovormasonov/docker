#!/bin/bash
# ===================================
# Скрипт настройки нового Email сервиса
# service_22cecl9
# ===================================

set -e

echo ""
echo "========================================"
echo "  Настройка Email сервиса service_22cecl9"
echo "========================================"
echo ""

# Проверка существования шаблонов
if [ ! -f "frontend/env.example" ]; then
    echo "[ОШИБКА] Файл frontend/env.example не найден!"
    exit 1
fi

if [ ! -f "env.prod.example" ]; then
    echo "[ОШИБКА] Файл env.prod.example не найден!"
    exit 1
fi

echo "Выберите вариант настройки:"
echo ""
echo "1. Локальная разработка (создать frontend/.env)"
echo "2. Продакшн Docker (создать .env.prod)"
echo "3. Оба варианта"
echo "4. Выход"
echo ""

read -p "Ваш выбор (1-4): " choice

case $choice in
    1)
        setup_local=true
        ;;
    2)
        setup_prod=true
        ;;
    3)
        setup_local=true
        setup_prod=true
        ;;
    4)
        echo "Выход..."
        exit 0
        ;;
    *)
        echo "Неверный выбор!"
        exit 1
        ;;
esac

# Настройка локальной разработки
if [ "$setup_local" = true ]; then
    echo ""
    echo "[1/2] Создание frontend/.env..."
    
    if [ -f "frontend/.env" ]; then
        echo "[!] Файл frontend/.env уже существует!"
        read -p "Перезаписать? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            echo "Пропускаем создание frontend/.env"
        else
            cp frontend/env.example frontend/.env
            echo "[OK] Файл frontend/.env создан"
        fi
    else
        cp frontend/env.example frontend/.env
        echo "[OK] Файл frontend/.env создан"
    fi
    
    echo ""
    echo "[2/2] Следующие шаги:"
    echo "  1. Откройте frontend/.env"
    echo "  2. Замените все значения your_* на реальные"
    echo "  3. Service ID уже установлен: service_22cecl9"
    echo "  4. Запустите: cd frontend && npm run dev"
    echo ""
fi

# Настройка продакшена
if [ "$setup_prod" = true ]; then
    echo ""
    echo "[1/2] Создание .env.prod..."
    
    if [ -f ".env.prod" ]; then
        echo "[!] Файл .env.prod уже существует!"
        read -p "Перезаписать? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            echo "Пропускаем создание .env.prod"
        else
            cp env.prod.example .env.prod
            echo "[OK] Файл .env.prod создан"
        fi
    else
        cp env.prod.example .env.prod
        echo "[OK] Файл .env.prod создан"
    fi
    
    echo ""
    echo "[2/2] Следующие шаги:"
    echo "  1. Откройте .env.prod"
    echo "  2. Замените ВСЕ значения your_* на реальные"
    echo "  3. Service ID уже установлен: service_22cecl9"
    echo "  4. Запустите Docker:"
    echo "     docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
    echo ""
fi

echo ""
echo "========================================"
echo "  Настройка завершена!"
echo "========================================"
echo ""
echo "Дополнительная информация:"
echo "  - Быстрый старт: QUICK-START-NEW-EMAIL-SERVICE.md"
echo "  - Подробная инструкция: ОБНОВЛЕНИЕ-EMAIL-СЕРВИСА.md"
echo "  - Полная документация: EMAILJS-SERVICE-UPDATE.md"
echo ""






