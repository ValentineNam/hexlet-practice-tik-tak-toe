FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем остальные файлы
COPY server/ ./server/

# Экспортируем порт
EXPOSE 5000

# Команда запуска
CMD ["node", "server/server.js"]
