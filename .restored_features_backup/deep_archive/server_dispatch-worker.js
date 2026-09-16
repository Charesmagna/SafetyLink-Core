import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import twilio from "twilio";
import dotenv from 'dotenv';

dotenv.config();

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID || "AC1234567890", process.env.TWILIO_AUTH_TOKEN || "KEY0123456789");

const worker = new Worker('dispatchQueue', async job => {
  const { type, payload } = job.data;
  console.log(`[Dispatch Worker] Processing job ${job.id} of type ${type}`);
  
  if (type === 'SMS') {
    const { to, message } = payload;
    console.log(`[Dispatch Worker] Sending SMS to ${to}...`);
    try {
      const response = await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to,
        body: message,
      });
      console.log(`[Dispatch Worker] SMS sent successfully. ID: ${response.sid}`);
      return { success: true, id: response.sid };
    } catch (err) {
      console.error(`[Dispatch Worker] Twilio SMS Error:`, err.message);
      throw err;
    }
  } else if (type === 'VOICE') {
    const { to, text } = payload;
    console.log(`[Dispatch Worker] Initiating Voice Call to ${to}...`);
    try {
      // In a real app you'd specify a valid connection_id and answer_url
      const response = await twilioClient.calls.create({
        connection_id: process.env.TWILIO_CONNECTION_ID || '1234567890',
        to,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        command_id: `call_${job.id}`,
      });
      console.log(`[Dispatch Worker] Voice Call initiated. ID: ${response.sid}`);
      return { success: true, id: response.sid };
    } catch (err) {
      console.error(`[Dispatch Worker] Twilio Voice Error:`, err.message);
      throw err;
    }
  }
}, { connection: redisConnection });

worker.on('completed', job => {
  console.log(`[Dispatch Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Dispatch Worker] Job ${job ? job.id : 'unknown'} failed with error: ${err.message}`);
});

console.log('[Dispatch Worker] BullMQ dispatch worker started and listening for jobs...');
