# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite frontend and compile server.ts to dist/server.cjs
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests for production installation
COPY package*.json ./

# Install only production dependencies to keep the image lean
RUN npm ci --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
