import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/safetylink'),
  NEON_DATA_API_URL: z.string().optional(),
  DATA_ENCRYPTION_KEY: z.string().default('00000000000000000000000000000000'),
  VAPI_PRIVATE_KEY: z.string().optional(),
  VAPI_PUBLIC_KEY: z.string().optional(),
  VAPI_ASSISTANT_ID: z.string().optional(),
  VAPI_PHONE_NUMBER_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  USSD_PROVIDER: z.string().default('africastalking'),
  USSD_API_KEY: z.string().optional(),
  USSD_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_PROVIDER: z.string().default('twilio'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  TWILIO_SID: z.string().optional(),
  TWILIO_NUMBER: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  INTERNAL_API_SECRET: z.string().optional(),
  RESPONSE_CENTRE_NUMBER: z.string().default('+27739441222'),
  NODE_ENV: z.string().default('development'),
  ALERTS_ENABLED: z.string().default('true').transform(v => v === 'true'),
  TEST_DESTINATION_NUMBER: z.string().default('+27680079911'),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  CLOUDINARY_CLOUD: z.string().default('qcp4fx2v'),
  CLOUDINARY_URL: z.string().default('https://res.cloudinary.com/qcp4fx2v'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export const env = envSchema.parse(process.env);
