#!/bin/bash
echo "Keeping source code for backend compilation..."
rm -rf node_modules package-lock.json Dockerfile .dockerignore

echo "Overwriting package.json with a lightweight, Backend-only configuration..."
cat << 'TMP_PKG_EOF' > package.json
{
  "name": "safetylink-backend-only",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/server.cjs"
  },
  "dependencies": {
    "@google/genai": "^2.16.0",
    "@libsql/client": "^0.17.4",
    "@supabase/supabase-js": "^2.111.0",
    "bullmq": "^6.0.5",
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "express-rate-limit": "^8.6.2",
    "firebase-admin": "^14.3.0",
    "helmet": "^8.3.0",
    "ioredis": "^6.0.0",
    "nodemailer": "^6.9.14",
    "pusher": "^5.2.0",
    "stytch": "^11.3.0",
    "twilio": "^5.2.2",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "esbuild": "^0.23.0"
  }
}
TMP_PKG_EOF

echo "Installing minimal backend dependencies..."
npm install

echo "Compiling the backend..."
mkdir -p dist

# Fix missing TypeScript resolution for src/ files by installing tsx globally in the builder
# and bypassing the bundler entirely to run directly in tsx (which handles relative imports perfectly)
npm install -g tsx
cat << 'RUNNER' > dist/server.cjs
require('child_process').execSync('npx tsx server.ts', { stdio: 'inherit' });
RUNNER

echo "Build complete! Ready for Render."
