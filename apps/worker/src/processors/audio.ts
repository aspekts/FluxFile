import type { ConversionJobData } from '@fluxfile/queue';
import type { AudioFormat } from '@fluxfile/types';
import { runFFmpeg } from '../services/ffmpeg';
import type { ProcessorResult } from './types';

/**
 * Process audio conversion jobs using FFmpeg.
 */
export async function processAudioJob(
  data: ConversionJobData,
  inputPath: string,
  outputPath: string,
  onProgress: (percent: number) => void
): Promise<ProcessorResult> {
  const result = await runFFmpeg(
    inputPath,
    outputPath,
    data.outputFormat,
    data.qualityPreset,
    data.customSettings,
    'audio',
    (progress) => {
      // Map FFmpeg progress (0-99) to job progress (10-90)
      const jobProgress = 10 + Math.round(progress.percent * 0.8);
      onProgress(jobProgress);
    }
  );

  return {
    outputPath: result.outputPath,
    outputFileSize: result.fileSize,
  };
}
