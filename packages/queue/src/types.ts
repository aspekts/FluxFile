import type { ConversionFormat, QualityPreset, ConversionSettings } from '@fluxfile/types';

export interface ConversionJobData {
  jobId: string;
  userId?: string;
  inputFileKey: string;
  originalFileName: string;
  inputFormat: ConversionFormat;
  outputFormat: ConversionFormat;
  inputFileSize: number;
  qualityPreset?: QualityPreset;
  customSettings?: ConversionSettings;
}
