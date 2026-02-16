import { NextResponse } from 'next/server';
import { prisma } from '@fluxfile/db';
import { getServerSession } from '@/lib/auth/session';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization
    const session = await getServerSession();
    if (job.userId && job.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only cancel jobs that are pending or processing
    if (!['PENDING', 'SCANNING', 'PROCESSING'].includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot cancel job with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId,
      status: 'CANCELLED',
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Job cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
  }
}
