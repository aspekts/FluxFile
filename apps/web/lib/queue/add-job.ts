import { conversionQueue } from '@fluxfile/queue';
import { JOB_PRIORITIES } from '@fluxfile/config';
import type { AccountTier } from '@fluxfile/types';
import type { ConversionJobData } from '@fluxfile/queue';

/**
 * Add a conversion job to the BullMQ queue.
 * Server-side only - call this from API routes or server actions.
 */
export async function addConversionJob(data: ConversionJobData, tier: AccountTier = 'FREE') {
  const priority = JOB_PRIORITIES[tier] ?? JOB_PRIORITIES.FREE;

  const job = await conversionQueue.add('convert', data, {
    priority,
    jobId: data.jobId,
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  });

  return job;
}
