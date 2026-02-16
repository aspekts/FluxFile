export const WORKER_CONCURRENCY = {
  audio: parseInt(process.env.WORKER_CONCURRENCY_AUDIO || '5', 10),
  video: parseInt(process.env.WORKER_CONCURRENCY_VIDEO || '2', 10),
  document: parseInt(process.env.WORKER_CONCURRENCY_DOCUMENT || '5', 10),
  image: parseInt(process.env.WORKER_CONCURRENCY_IMAGE || '20', 10),
} as const;

export const RETRY_STRATEGY = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // 2 seconds
  },
} as const;

export const QUEUE_NAMES = {
  CONVERSION: 'conversion',
  MALWARE_SCAN: 'malware-scan',
  CLEANUP: 'cleanup',
} as const;

export const JOB_PRIORITIES = {
  ENTERPRISE: 1,
  PRO: 5,
  FREE: 10,
  ANONYMOUS: 15,
} as const;
