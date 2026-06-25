FROM node:18-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
USER node
ENTRYPOINT ["dumb-init","--"]
CMD ["node","backend/src/app.js"]
