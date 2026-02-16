export type EnterpriseStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface Enterprise {
  id: string;
  companyName: string;
  status: EnterpriseStatus;
  contractStartDate: Date;
  contractEndDate: Date;
  contractDocumentUrl?: string;
  dailyQuotaOverride?: number;
  maxFileSizeGB: number;
  batchSizeLimit: number;
  dedicatedWorkerCount: number;
  storageRetentionHours: number;
  auditLogsEnabled: boolean;
  priorityQueue: boolean;
  ssoEnabled: boolean;
  monthlyFeeUSD: number;
  billingEmail: string;
  salesContactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  enterpriseId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
