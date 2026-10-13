/**
 * Environment configuration with runtime validation
 * All env vars are validated and typed at server startup
 */

export const env = {
  // Core
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'staging',
  PORT: getNumberEnv('PORT', 3000),
  
  // Database & Storage
  DATABASE_URL: requireEnv('DATABASE_URL', 'sqlite://./data.db'),
  REDIS_URL: process.env.REDIS_URL || '',
  
  // R2 & Cloudflare
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET: process.env.R2_BUCKET || 'media',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_PREFIX: process.env.R2_PREFIX || 'safetylink/',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  CLOUDINARY_CLOUD: process.env.CLOUDINARY_CLOUD || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // Authentication & Security
  JWT_SECRET: requireEnv('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRY: getNumberEnv('JWT_EXPIRY', 86400000), // 24h in ms
  INTERNAL_API_SECRET: requireEnv('INTERNAL_API_SECRET', 'internal-secret-key'),
  
  // AI & APIs
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  VAPI_PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY || '',
  VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID || '',
  VAPI_PHONE_NUMBER_ID: process.env.VAPI_PHONE_NUMBER_ID || '',
  BLAND_API_KEY: process.env.BLAND_API_KEY || '',
  
  // Communications
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '',
  TWILIO_SID: process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_NUMBER || '+16055695774',
  TWILIO_NUMBER: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_NUMBER || '+16055695774',
  AT_API_KEY: process.env.AT_API_KEY || '',
  AT_USERNAME: process.env.AT_USERNAME || 'SafetyLink',
  USSD_PROVIDER: process.env.USSD_PROVIDER || 'africastalking',
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'twilio',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  ALERTS_ENABLED: process.env.ALERTS_ENABLED !== 'false',
  
  // Payments
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  PAYFAST_MERCHANT_ID: process.env.PAYFAST_MERCHANT_ID || '',
  PAYFAST_MERCHANT_KEY: process.env.PAYFAST_MERCHANT_KEY || '',
  PAYFAST_PASSPHRASE: process.env.PAYFAST_PASSPHRASE || '',
  
  // Realtime & Push
  PUSHER_APP_ID: process.env.PUSHER_APP_ID || '',
  PUSHER_APP_KEY: process.env.PUSHER_APP_KEY || '',
  PUSHER_APP_SECRET: process.env.PUSHER_APP_SECRET || '',
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID || '',
  
  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'safetylink-99e56',
  
  // Email
  MERCHANT_EMAIL: process.env.MERCHANT_EMAIL || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  MERCHANT_FULFILLMENT_EMAIL: process.env.MERCHANT_FULFILLMENT_EMAIL || '',
  
  // Emergency Contacts
  RESPONSE_CENTRE_NUMBER: process.env.RESPONSE_CENTRE_NUMBER || '+27739441222',
  TEST_DESTINATION_NUMBER: process.env.TEST_DESTINATION_NUMBER || '+27680079911',
  
  // Feature Flags
  FEATURE_R2_MEDIA: getBooleanEnv('FEATURE_R2_MEDIA', true),
  FEATURE_CLOUDINARY: getBooleanEnv('FEATURE_CLOUDINARY', true),
  FEATURE_PAYSTACK: getBooleanEnv('FEATURE_PAYSTACK', true),
  FEATURE_PAYFAST: getBooleanEnv('FEATURE_PAYFAST', true),
  FEATURE_TWILIO_VOICE: getBooleanEnv('FEATURE_TWILIO_VOICE', true),
  FEATURE_AFRICASTALKING: getBooleanEnv('FEATURE_AFRICASTALKING', true),
  FEATURE_AI_VOICE_SUMMARY: getBooleanEnv('FEATURE_AI_VOICE_SUMMARY', true),
  FEATURE_OFFLINE_MODE: getBooleanEnv('FEATURE_OFFLINE_MODE', true),
  
  // Performance & Limits
  API_RATE_LIMIT_MAX: getNumberEnv('API_RATE_LIMIT_MAX', 200),
  REQUEST_TIMEOUT_MS: getNumberEnv('REQUEST_TIMEOUT_MS', 30000),
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '50mb',
  WORKER_POOL_SIZE: getNumberEnv('WORKER_POOL_SIZE', 4),
  QUEUE_CONCURRENCY: getNumberEnv('QUEUE_CONCURRENCY', 10),
  QUEUE_MAX_ATTEMPTS: getNumberEnv('QUEUE_MAX_ATTEMPTS', 3),
  
  // Monitoring & Logging
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  ENABLE_METRICS: getBooleanEnv('ENABLE_METRICS', true),
  
  // CORS & Security
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'https://safetylink.online,http://localhost:5173,http://localhost:3000').split(','),
  ENFORCE_HTTPS: getBooleanEnv('ENFORCE_HTTPS', true),
};

export function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    console.warn(`[env] Invalid number for ${name}="${raw}", using fallback ${fallback}`);
    return fallback;
  }
  return parsed;
}

export function getBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = (process.env[name] ?? '').toLowerCase().trim();
  if (raw === '') return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

export function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    if (fallback !== undefined) {
      console.warn(`[env] Missing ${name}, using fallback`);
      return fallback;
    }
    throw new Error(
      `Missing required environment variable: ${name}\nPlease set it in .env or CI/CD secrets.`
    );
  }
  return value;
}

/**
 * Validate all critical environment variables at startup
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Critical for production
  if (env.NODE_ENV === 'production') {
    if (!env.JWT_SECRET || env.JWT_SECRET === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be set and unique in production');
    }
    if (!env.PAYSTACK_SECRET_KEY && env.FEATURE_PAYSTACK) {
      errors.push('PAYSTACK_SECRET_KEY required if FEATURE_PAYSTACK=true');
    }
    if (!env.PAYFAST_MERCHANT_ID && env.FEATURE_PAYFAST) {
      errors.push('PAYFAST_MERCHANT_ID required if FEATURE_PAYFAST=true');
    }
  }
  
  // R2 validation
  if (env.FEATURE_R2_MEDIA) {
    if (!env.R2_ACCESS_KEY_ID) errors.push('R2_ACCESS_KEY_ID required for R2 media');
    if (!env.R2_SECRET_ACCESS_KEY) errors.push('R2_SECRET_ACCESS_KEY required for R2 media');
    if (!env.CLOUDFLARE_API_TOKEN) errors.push('CLOUDFLARE_API_TOKEN required for R2 media');
  }
  
  // Cloudinary validation
  if (env.FEATURE_CLOUDINARY) {
    if (!env.CLOUDINARY_CLOUD) errors.push('CLOUDINARY_CLOUD required for Cloudinary');
    if (!env.CLOUDINARY_API_KEY) errors.push('CLOUDINARY_API_KEY required for Cloudinary');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log environment configuration (safe, no secrets)
 */
export function logEnvironment(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║ SafetyLink Core - Environment Configuration                    ║
╚════════════════════════════════════════════════════════════════╝

🔧 Core:
  NODE_ENV: ${env.NODE_ENV}
  PORT: ${env.PORT}
  LOG_LEVEL: ${env.LOG_LEVEL}

💾 Storage:
  R2_MEDIA: ${env.FEATURE_R2_MEDIA ? '✅' : '❌'} (${env.R2_BUCKET})
  CLOUDINARY: ${env.FEATURE_CLOUDINARY ? '✅' : '❌'} (${env.CLOUDINARY_CLOUD})

🔐 Security:
  JWT: Configured (expires in ${env.JWT_EXPIRY}ms)
  CORS Origins: ${env.CORS_ORIGINS.join(', ')}

💳 Payments:
  PAYSTACK: ${env.FEATURE_PAYSTACK ? '✅' : '❌'}
  PAYFAST: ${env.FEATURE_PAYFAST ? '✅' : '❌'}

📞 Communications:
  TWILIO: ${env.FEATURE_TWILIO_VOICE ? '✅' : '❌'}
  AFRICASTALKING: ${env.FEATURE_AFRICASTALKING ? '✅' : '❌'}

⚡ Performance:
  Rate Limit: ${env.API_RATE_LIMIT_MAX} req/15min
  Timeout: ${env.REQUEST_TIMEOUT_MS}ms
  Queue Concurrency: ${env.QUEUE_CONCURRENCY}
  Redis: ${env.REDIS_URL ? '✅ Configured' : '⚠️  Using fallback mode'}

📊 Monitoring:
  Metrics: ${env.ENABLE_METRICS ? '✅' : '❌'}
  Sentry: ${env.SENTRY_DSN ? '✅' : '❌'}

`);
}
