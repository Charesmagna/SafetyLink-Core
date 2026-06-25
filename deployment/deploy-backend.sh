#!/usr/bin/env bash
# SAFETY-LINK Backend Deploy Script
# Supports: Docker Compose or PM2 bare-metal
set -euo pipefail

MODE="${1:-docker}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

echo "==> SAFETY-LINK Backend Deployment [mode: $MODE]"

if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

if [ "$MODE" = "docker" ]; then
  echo "==> Pulling latest images"
  docker compose pull

  echo "==> Running migrations"
  docker compose run --rm app node backend/db/migrate.js

  echo "==> Starting services"
  docker compose up -d --build

  echo "==> Health check"
  sleep 5
  curl -sf http://localhost:5000/api/health && echo " OK" || echo " WARN: health check failed"

elif [ "$MODE" = "pm2" ]; then
  echo "==> Installing dependencies"
  npm ci --omit=dev

  echo "==> Running migrations"
  node backend/db/migrate.js

  echo "==> Starting with PM2"
  npm install -g pm2 || true
  pm2 startOrRestart ecosystem.config.js --env production
  pm2 save

  echo "==> Status"
  pm2 status

else
  echo "Usage: $0 [docker|pm2]"
  exit 1
fi

echo "==> Deployment complete."
