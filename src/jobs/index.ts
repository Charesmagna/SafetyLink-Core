import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { processPanicAlert } from '../services/panic-alert';

const isLocalRedis = env.REDIS_URL.includes('localhost') || env.REDIS_URL.includes('127.0.0.1');

const connection = isLocalRedis ? undefined : {
  url: env.REDIS_URL,
};

export const alertQueue = isLocalRedis ? {
  add: async (name: string, data: any) => {
    console.log(`[Mock Queue] Job added: ${name}`);
    setTimeout(() => {
      if (name === 'process-incident') {
        processPanicAlert(data.incidentId).catch(err => console.error('Mock job error:', err));
      }
    }, 100);
  }
} as any : new Queue('panic-alerts', { connection });

export const alertWorker = isLocalRedis ? null : new Worker('panic-alerts', async (job: Job) => {
  if (job.name === 'process-incident') {
    await processPanicAlert(job.data.incidentId);
  }
}, { connection });

if (alertWorker) {
  alertWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
}
