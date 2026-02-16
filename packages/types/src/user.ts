export type AccountTier = 'ANONYMOUS' | 'FREE' | 'PRO' | 'ENTERPRISE';
export type UserRole = 'USER' | 'ENTERPRISE' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string;
  accountTier: AccountTier;
  role: UserRole;
  enterpriseId?: string;
  dailyConversionsUsed: number;
  lastResetDate: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaLimits {
  conversionsPerDay: number;
  maxFileSize: number;
  batchSize: number;
  priorityQueue: boolean;
}
