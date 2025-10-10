# Frontend Dockerfile - многоступенчатая сборка
# Этап 1: Сборка приложения
FROM node:18-alpine AS builder

WORKDIR /app

# Принимаем build arguments для EmailJS
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_EMAILJS_VERIFICATION_TEMPLATE_ID
ARG VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID

# Экспортируем как переменные окружения для Vite
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY
ENV VITE_EMAILJS_VERIFICATION_TEMPLATE_ID=$VITE_EMAILJS_VERIFICATION_TEMPLATE_ID
ENV VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID=$VITE_EMAILJS_RESET_PASSWORD_TEMPLATE_ID

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production=false --legacy-peer-deps

# Копируем исходники
COPY . .

# Собираем production build (переменные VITE_* будут вшиты в сборку)
RUN npm run build

# Этап 2: Nginx для раздачи статики
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Порт
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
