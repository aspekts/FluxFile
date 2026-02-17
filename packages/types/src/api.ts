import type { ConversionFormat } from './formats';
import type { QualityPreset, ConversionSettings, ConversionJob } from './conversion';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface JobCreateRequest {
  inputFileKey: string;
  inputFormat: ConversionFormat;
  outputFormat: ConversionFormat;
  qualityPreset?: QualityPreset;
  customSettings?: ConversionSettings;
}

export interface JobStatusResponse {
  job: ConversionJob;
  downloadUrl?: string;
}

export interface BatchJobCreateRequest {
  jobs: JobCreateRequest[];
}
