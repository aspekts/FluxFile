import { NextResponse } from 'next/server';
import { prisma } from '@fluxfile/db';
import { generateDownloadUrl } from '@fluxfile/storage';
import { getServerSession } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        inputFileKey: true,
        outputFileKey: true,
        inputFormat: true,
        outputFormat: true,
        inputFileSize: true,
        outputFileSize: true,
        qualityPreset: true,
        status: true,
        progress: true,
        currentStage: true,
        errorMessage: true,
        errorType: true,
        queuedAt: true,
        startedAt: true,
        completedAt: true,
        processingTimeMs: true,
        estimatedTimeMs: true,
        downloadExpiresAt: true,
        createdAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization - job belongs to user or is anonymous
    const session = await getServerSession();
    if (job.userId && job.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate download URL if job is completed
    let downloadUrl: string | null = null;
    if (job.status === 'COMPLETED' && job.outputFileKey) {
      const now = new Date();
      if (job.downloadExpiresAt && now < job.downloadExpiresAt) {
        downloadUrl = await generateDownloadUrl(job.outputFileKey);
      }
    }

    return NextResponse.json({
      ...job,
      // Serialize BigInt to string for JSON
      inputFileSize: job.inputFileSize.toString(),
      outputFileSize: job.outputFileSize?.toString() || null,
      downloadUrl,
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
  }
}
