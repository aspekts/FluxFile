import type { AccountTier, QuotaLimits } from '@fluxfile/types';

export const TIER_LIMITS: Record<AccountTier, QuotaLimits> = {
  ANONYMOUS: {
    conversionsPerDay: 5, // per hour actually
    maxFileSize: 50 * 1024 * 1024, // 50MB
    batchSize: 1,
    priorityQueue: false,
  },
  FREE: {
    conversionsPerDay: 25,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    batchSize: 5,
    priorityQueue: false,
  },
  PRO: {
    conversionsPerDay: 500,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    batchSize: 10,
    priorityQueue: true,
  },
  ENTERPRISE: {
    conversionsPerDay: -1, // unlimited
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    batchSize: 50,
    priorityQueue: true,
  },
};

export const CATEGORY_LIMITS = {
  audio: {
    maxSize: 500 * 1024 * 1024, // 500MB
    maxProcessingTime: 10 * 60 * 1000, // 10 minutes
    maxQueueTime: 5 * 60 * 1000, // 5 minutes
  },
  video: {
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxProcessingTime: 30 * 60 * 1000, // 30 minutes
    maxQueueTime: 10 * 60 * 1000, // 10 minutes
  },
  document: {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxProcessingTime: 15 * 60 * 1000, // 15 minutes
    maxQueueTime: 3 * 60 * 1000, // 3 minutes
    maxPages: 500,
  },
  image: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxProcessingTime: 5 * 60 * 1000, // 5 minutes
    maxQueueTime: 2 * 60 * 1000, // 2 minutes
    maxDimensions: 25000, // 25000x25000
  },
} as const;

export const FILE_RETENTION_HOURS = 24;
export const DOWNLOAD_LINK_EXPIRY_HOURS = 24;
export const PRESIGNED_URL_EXPIRY_MINUTES = 15;
