import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

// Standard Redis connection optimized for Railway/self-hosted Redis
export const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Railway Redis optimizations
  lazyConnect: false,
  keepAlive: 30000,
});
