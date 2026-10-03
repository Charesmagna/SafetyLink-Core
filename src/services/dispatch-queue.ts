import IORedis from 'ioredis';
import { Queue } from 'bullmq';

export interface DispatchQueue {
  add: (name: string, data: any, opts?: any) => Promise<any>;
  on: (event: string, handler: (payload?: any) => void) => void;
}

let queueInstance: DispatchQueue | null = null;
let redisConnection: IORedis | null = null;

function createFallbackQueue(): DispatchQueue {
  return {
    add: async (...args: any[]) => {
      console.warn('[dispatch-queue] Redis not configured. Mock job queued.', args[0], args[1]);
      return { id: `mock-${Date.now()}` };
    },
    on: () => undefined,
  };
}

export function createPanicQueue(): DispatchQueue {
  if (queueInstance) return queueInstance;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    queueInstance = createFallbackQueue();
    return queueInstance;
  }

  try {
    if (!redisConnection) {
      redisConnection = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
      });

      redisConnection.on('error', (err) => {
        console.warn('[dispatch-queue] Redis connection error (falling back):', err.message);
        queueInstance = createFallbackQueue();
      });
    }

    queueInstance = new Queue('panicQueue', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    queueInstance.on('error', (err: any) => {
      console.warn('[dispatch-queue] Queue error (continuing in fallback mode):', err?.message || err);
      queueInstance = createFallbackQueue();
    });

    return queueInstance;
  } catch (error: any) {
    console.warn('[dispatch-queue] Failed to initialize BullMQ:', error?.message || error);
    queueInstance = createFallbackQueue();
    return queueInstance;
  }
}
