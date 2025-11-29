#!/bin/bash

# =============================================
# Проверка автоматического назначения экспертов
# =============================================

echo ""
echo "========================================"
echo "Проверка платежей и статусов экспертов"
echo "========================================"
echo ""

# Проверяем, что указаны переменные окружения
if [ -z "$DB_NAME" ]; then
    read -p "Введите имя базы данных: " DB_NAME
fi

if [ -z "$DB_USER" ]; then
    read -p "Введите имя пользователя БД (по умолчанию postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
fi

echo ""
echo "Подключение к базе данных: $DB_NAME"
echo "Пользователь: $DB_USER"
echo ""

# Выполняем SQL скрипт
psql -U "$DB_USER" -d "$DB_NAME" -f FIX-PAYMENTS-AUTO-EXPERT.sql

if [ $? -ne 0 ]; then
    echo ""
    echo "[ОШИБКА] Не удалось выполнить SQL скрипт"
    echo "Проверьте:"
    echo "- Установлен ли PostgreSQL"
    echo "- Правильно ли указаны DB_NAME и DB_USER"
    echo "- Есть ли файл FIX-PAYMENTS-AUTO-EXPERT.sql"
    echo ""
    exit 1
fi

echo ""
echo "========================================"
echo "Проверка завершена"
echo "========================================"
echo ""
echo "Если скрипт показал проблемные платежи:"
echo "1. Откройте файл FIX-PAYMENTS-AUTO-EXPERT.sql"
echo "2. Раскомментируйте блок DO \$\$ (строки 61-97)"
echo "3. Запустите этот скрипт снова"
echo ""
echo "Для перезапуска backend выполните:"
echo "  docker-compose restart backend"
echo ""

