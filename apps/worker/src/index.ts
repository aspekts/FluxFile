import { Worker, Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { redisConnection } from '@fluxfile/queue';
import type { ConversionJobData } from '@fluxfile/queue';
import { QUEUE_NAMES, getFormatCategory } from '@fluxfile/config';
import { downloadFile, uploadFile, deleteFile, R2_PATHS } from '@fluxfile/storage';
import { prisma } from '@fluxfile/db';
import {
  processAudioJob,
  processVideoJob,
  processImageJob,
  processDocumentJob,
} from './processors';
import type { ProcessorResult } from './processors';
import { ensureDir, cleanupDir, streamToFile, getMimeType } from './utils/fs';

const WORKER_ID = process.env.WORKER_ID || `worker-${os.hostname()}-${process.pid}`;
const TEMP_DIR = path.join(os.tmpdir(), 'fluxfile-worker');
const DOWNLOAD_EXPIRY_HOURS = 24;

console.log(`FluxFile Worker ${WORKER_ID} starting...`);

/**
 * Main job processing function.
 */
async function processConversionJob(job: Job<ConversionJobData>): Promise<{ success: boolean }> {
  const { data } = job;
  const { jobId, inputFileKey, inputFormat, outputFormat } = data;
  const category = getFormatCategory(inputFormat);

  // Create a temp directory for this job
  const jobTempDir = path.join(TEMP_DIR, jobId);
  const inputPath = path.join(jobTempDir, `input.${inputFormat}`);
  const outputPath = path.join(jobTempDir, `output.${outputFormat}`);

  try {
    // ── Stage 1: Update status to PROCESSING ──
    await updateJobStatus(jobId, 'PROCESSING', 0, 'Initializing');
    await job.updateProgress(5);

    // ── Stage 2: Download input file from R2 ──
    await updateJobStage(jobId, 'Downloading input file');
    await ensureDir(jobTempDir);

    const inputStream = await downloadFile(inputFileKey);
    await streamToFile(inputStream, inputPath);

    await job.updateProgress(10);
    await updateJobProgress(jobId, 10, 'Processing');

    // ── Stage 3: Run format-specific conversion ──
    let result: ProcessorResult;
    const progressCallback = async (percent: number) => {
      await job.updateProgress(percent);
      await updateJobProgress(jobId, percent, 'Converting');
    };

    switch (category) {
      case 'audio':
        result = await processAudioJob(data, inputPath, outputPath, progressCallback);
        break;
      case 'video':
        result = await processVideoJob(data, inputPath, outputPath, progressCallback);
        break;
      case 'image':
        result = await processImageJob(data, inputPath, outputPath, progressCallback);
        break;
      case 'document':
        result = await processDocumentJob(data, inputPath, jobTempDir, progressCallback);
        break;
      default:
        throw new Error(`Unsupported format category: ${category}`);
    }

    await job.updateProgress(90);
    await updateJobProgress(jobId, 90, 'Uploading result');

    // ── Stage 4: Upload result to R2 ──
    const outputKey = `${R2_PATHS.RESULTS}${jobId}/output.${outputFormat}`;
    const outputBuffer = fs.readFileSync(result.outputPath);
    const contentType = getMimeType(outputFormat);
    await uploadFile(outputKey, outputBuffer, contentType);

    await job.updateProgress(95);

    // ── Stage 5: Update job as completed ──
    const downloadExpiresAt = new Date(Date.now() + DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        currentStage: 'Completed',
        outputFileKey: outputKey,
        outputFileSize: BigInt(result.outputFileSize),
        completedAt: new Date(),
        processingTimeMs: Date.now() - (await getJobStartTime(jobId)),
        workerId: WORKER_ID,
        downloadExpiresAt,
      },
    });

    await job.updateProgress(100);

    console.log(
      `Job ${jobId} completed successfully (${category}: ${inputFormat} -> ${outputFormat})`
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = classifyError(errorMessage);

    console.error(`Job ${jobId} failed:`, errorMessage);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: errorMessage.slice(0, 1000),
        errorType,
        completedAt: new Date(),
        workerId: WORKER_ID,
      },
    });

    throw error; // Re-throw so BullMQ handles retries
  } finally {
    // ── Cleanup: Remove temp files ──
    try {
      await cleanupDir(jobTempDir);
    } catch {
      console.warn(`Failed to cleanup temp dir: ${jobTempDir}`);
    }
  }
}

// ── Database helper functions ──

async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  stage: string
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: status as any,
      progress,
      currentStage: stage,
      startedAt: status === 'PROCESSING' ? new Date() : undefined,
      workerId: WORKER_ID,
    },
  });
}

async function updateJobProgress(jobId: string, progress: number, stage: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      currentStage: stage,
    },
  });
}

async function updateJobStage(jobId: string, stage: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { currentStage: stage },
  });
}

async function getJobStartTime(jobId: string): Promise<number> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { startedAt: true },
  });
  return job?.startedAt?.getTime() || Date.now();
}

/**
 * Classify an error message into an ErrorType enum value.
 */
function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('corrupt') || lower.includes('invalid data') || lower.includes('moov atom')) {
    return 'CORRUPT_FILE';
  }
  if (lower.includes('malware') || lower.includes('virus')) {
    return 'MALWARE_DETECTED';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'WORKER_TIMEOUT';
  }
  if (lower.includes('unsupported') || lower.includes('unknown format')) {
    return 'UNSUPPORTED_FORMAT';
  }
  if (lower.includes('too large') || lower.includes('file size')) {
    return 'FILE_TOO_LARGE';
  }
  if (lower.includes('storage') || lower.includes('s3') || lower.includes('r2')) {
    return 'STORAGE_ERROR';
  }
  return 'UNKNOWN';
}

// ── Create the BullMQ Worker ──

const worker = new Worker<ConversionJobData>(QUEUE_NAMES.CONVERSION, processConversionJob, {
  connection: redisConnection,
  concurrency: 5,
  lockDuration: 30 * 60 * 1000, // 30 minutes max per job
  lockRenewTime: 15 * 1000, // Renew lock every 15 seconds
});

// ── Worker event handlers ──

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(
    `Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}):`,
    err.message
  );
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`);
});

// ── Graceful shutdown ──

async function shutdown(signal: string) {
  console.log(`${signal} received, closing worker ${WORKER_ID}...`);
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log(
  `Worker ${WORKER_ID} ready and listening for jobs on queue "${QUEUE_NAMES.CONVERSION}"`
);
