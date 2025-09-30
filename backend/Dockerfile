# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (для сборки нужны dev)
RUN npm install

# Копируем исходники
COPY . .

# Собираем TypeScript
RUN npm run build

# Удаляем dev-зависимости после сборки
RUN npm prune --production

# Порт приложения
EXPOSE 3001

# Запуск
CMD ["node", "dist/server.js"]
