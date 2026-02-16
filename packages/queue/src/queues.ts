import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from './client';
import { QUEUE_NAMES } from '@fluxfile/config';
import type { ConversionJobData } from './types';

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
};

export const conversionQueue = new Queue<ConversionJobData>(QUEUE_NAMES.CONVERSION, queueOptions);
