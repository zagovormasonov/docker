@echo off
echo Starting Synergy DEV Server...

if not exist .env.dev (
    echo Error: .env.dev file not found!
    echo Please create .env.dev from env.dev.example
    pause
    exit /b 1
)

docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

echo DEV server is running on http://localhost:8081
echo Login: admin
echo Password: defender007
pause
