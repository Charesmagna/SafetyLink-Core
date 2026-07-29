FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Initialize sqlite DB on startup
CMD npx prisma migrate deploy && npm start
