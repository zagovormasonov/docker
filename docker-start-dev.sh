#!/bin/bash
echo "Starting Synergy DEV Server..."

# Проверка наличия .env.dev
if [ ! -f .env.dev ]; then
    echo "Error: .env.dev file not found!"
    echo "Please create .env.dev from env.dev.example"
    exit 1
fi

# Запуск Docker Compose
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

echo "DEV server is running!"
echo "If you are on the server, it's likely on port 8081"
echo "Login: admin"
echo "Password: defender007"
