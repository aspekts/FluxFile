import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from './client';
import { QUEUE_NAMES } from '@fluxfile/config';
import type { ConversionJobData } from './types';

const queueOptions: QueueOptions = {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 7200, // 2 hours (balanced - job data is in PostgreSQL but useful for debugging)
      count: 500, // Keep moderate number of completed jobs for monitoring
    },
    removeOnFail: {
      age: 172800, // 2 days (better debugging window for failures)
    },
  },
};

export const conversionQueue = new Queue<ConversionJobData>(QUEUE_NAMES.CONVERSION, queueOptions);
