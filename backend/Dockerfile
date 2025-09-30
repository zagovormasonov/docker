# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходники
COPY . .

# Собираем TypeScript
RUN npm install typescript tsx --save-dev && npm run build

# Удаляем dev-зависимости
RUN npm prune --production

# Порт приложения
EXPOSE 3001

# Запуск
CMD ["node", "dist/server.js"]
