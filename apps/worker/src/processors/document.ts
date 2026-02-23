import * as path from 'path';
import type { ConversionJobData } from '@fluxfile/queue';
import type { DocumentFormat } from '@fluxfile/types';
import { convertDocument } from '../services/libreoffice';
import { convertPdfToText } from '../services/pdftotext';
import type { ProcessorResult } from './types';

/**
 * Process document conversion jobs.
 * Uses pdftotext for PDF → TXT (better text extraction).
 * Uses LibreOffice for all other document conversions.
 */
export async function processDocumentJob(
  data: ConversionJobData,
  inputPath: string,
  outputDir: string,
  onProgress: (percent: number) => void
): Promise<ProcessorResult> {
  const inputFormat = data.inputFormat.toLowerCase();
  const outputFormat = data.outputFormat.toLowerCase();

  // Special case: PDF to TXT - use pdftotext for better extraction
  if (inputFormat === 'pdf' && outputFormat === 'txt') {
    const outputPath = path.join(outputDir, 'output.txt');
    const result = await convertPdfToText(inputPath, outputPath, (percent) => {
      const jobProgress = 10 + Math.round(percent * 0.8);
      onProgress(jobProgress);
    });

    return {
      outputPath: result.outputPath,
      outputFileSize: result.fileSize,
    };
  }

  // All other conversions use LibreOffice
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
