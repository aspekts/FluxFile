import type { ConversionFormat } from './formats';

export type JobStatus =
  | 'PENDING'
  | 'SCANNING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ErrorType =
  | 'CORRUPT_FILE'
  | 'MALWARE_DETECTED'
  | 'WORKER_TIMEOUT'
  | 'WORKER_CRASH'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'QUOTA_EXCEEDED'
  | 'STORAGE_ERROR'
  | 'UNKNOWN';

export type QualityPreset = 'low' | 'standard' | 'high' | 'original';

export interface ConversionJob {
  id: string;
  userId?: string;
  inputFileKey: string;
  outputFileKey?: string;
  inputFormat: ConversionFormat;
  outputFormat: ConversionFormat;
  inputFileSize: number;
  outputFileSize?: number;
  qualityPreset?: QualityPreset;
  customSettings?: Record<string, unknown>;
  status: JobStatus;
  progress: number;
  errorMessage?: string;
  errorType?: ErrorType;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
  workerId?: string;
  downloadExpiresAt?: Date;
}

export interface ConversionProgress {
  jobId: string;
  status: JobStatus;
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
}

export interface ConversionSettings {
  // Audio settings
  audioBitrate?: number;
  audioSampleRate?: number;
  audioChannels?: number;

  // Video settings
  videoResolution?: string;
  videoBitrate?: number;
  videoFrameRate?: number;
  videoCodec?: string;
  audioCodec?: string;

  // Document settings
  documentDPI?: number;

  // Image settings
  imageQuality?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageFit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}
