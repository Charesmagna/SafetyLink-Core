FROM node:18-alpine AS builder
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production

FROM node:18-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY backend/src ./src
COPY database ./database
EXPOSE 3000
USER node
ENTRYPOINT ["dumb-init","--"]
CMD ["node","src/app.js"]
