import type { ConversionJobData } from '@fluxfile/queue';
import type { ImageFormat } from '@fluxfile/types';
import { convertImage } from '../services/sharp';
import type { ProcessorResult } from './types';

/**
 * Process image conversion jobs using Sharp.
 */
export async function processImageJob(
  data: ConversionJobData,
  inputPath: string,
  outputPath: string,
  onProgress: (percent: number) => void
): Promise<ProcessorResult> {
  const result = await convertImage(
    inputPath,
    outputPath,
    data.outputFormat as ImageFormat,
    data.qualityPreset,
    data.customSettings,
    (percent) => {
      // Map Sharp progress (0-100) to job progress (10-90)
      const jobProgress = 10 + Math.round(percent * 0.8);
      onProgress(jobProgress);
    }
  );

  return {
    outputPath: result.outputPath,
    outputFileSize: result.fileSize,
  };
}
