import * as path from 'path';
import type { ConversionJobData } from '@fluxfile/queue';
import type { DocumentFormat } from '@fluxfile/types';
import { convertDocument } from '../services/libreoffice';
import type { ProcessorResult } from './types';

/**
 * Process document conversion jobs using LibreOffice.
 */
export async function processDocumentJob(
  data: ConversionJobData,
  inputPath: string,
  outputDir: string,
  onProgress: (percent: number) => void
): Promise<ProcessorResult> {
  const result = await convertDocument(
    inputPath,
    outputDir,
    data.outputFormat as DocumentFormat,
    data.qualityPreset,
    data.customSettings,
    (percent) => {
      // Map LibreOffice progress (0-100) to job progress (10-90)
      const jobProgress = 10 + Math.round(percent * 0.8);
      onProgress(jobProgress);
    }
  );

  return {
    outputPath: result.outputPath,
    outputFileSize: result.fileSize,
  };
}
