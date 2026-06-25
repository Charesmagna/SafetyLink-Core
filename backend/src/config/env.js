import 'dotenv/config';

export const ENV = {
  NODE_ENV:     process.env.NODE_ENV     || 'development',
  PORT:         parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  BACKEND_URL:  process.env.BACKEND_URL  || 'http://localhost:5000',

  JWT_SECRET:         process.env.JWT_SECRET         || 'change-me-jwt-secret-min-32-chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret-min-32',
  JWT_ACCESS_TTL:     '15m',
  JWT_REFRESH_TTL:    '7d',

  AES_KEY: (process.env.AES_KEY || 'safetylink-default-key-change-me').padEnd(32, '0').slice(0, 32),

  FCM_SERVER_KEY:  process.env.FCM_SERVER_KEY  || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',

  REDIS_URL: process.env.REDIS_URL || '',

  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',

  PLATFORM_OWNER_EMAIL: process.env.PLATFORM_OWNER_EMAIL || '',
};
