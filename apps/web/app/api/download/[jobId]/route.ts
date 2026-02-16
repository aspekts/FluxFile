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
        status: true,
        outputFileKey: true,
        downloadExpiresAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization
    const session = await getServerSession();
    if (job.userId && job.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check job is completed
    if (job.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Job is not yet completed' }, { status: 400 });
    }

    if (!job.outputFileKey) {
      return NextResponse.json({ error: 'No output file available' }, { status: 404 });
    }

    // Check download expiry
    if (job.downloadExpiresAt && new Date() > job.downloadExpiresAt) {
      return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl(job.outputFileKey);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
