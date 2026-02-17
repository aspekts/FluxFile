import { NextResponse } from 'next/server';
import { prisma } from '@fluxfile/db';
import { getServerSession } from '@/lib/auth/session';
import { validateConversion } from '@/lib/validation/file-validation';
import { addConversionJob } from '@/lib/queue/add-job';
import { TIER_LIMITS } from '@fluxfile/config';
import { getFormatCategory } from '@fluxfile/config';
import type { AccountTier } from '@fluxfile/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      inputFileKey,
      inputFormat,
      outputFormat,
      inputFileSize,
      qualityPreset = 'standard',
      customSettings,
    } = body;

    if (!inputFileKey || !inputFormat || !outputFormat || !inputFileSize) {
      return NextResponse.json(
        { error: 'inputFileKey, inputFormat, outputFormat, and inputFileSize are required' },
        { status: 400 }
      );
    }

    // Validate conversion
    const conversionValidation = validateConversion(inputFormat, outputFormat);
    if (!conversionValidation.valid) {
      return NextResponse.json({ error: conversionValidation.error }, { status: 400 });
    }

    // Get session
    const session = await getServerSession();
    const userId = session?.user?.id || null;
    const tier = ((session?.user as any)?.accountTier || 'ANONYMOUS') as AccountTier;

    // Check daily quota
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          dailyConversionsUsed: true,
          lastResetDate: true,
          accountTier: true,
        },
      });

      if (user) {
        const now = new Date();
        const lastReset = new Date(user.lastResetDate);
        const isNewDay = now.toDateString() !== lastReset.toDateString();

        const currentUsage = isNewDay ? 0 : user.dailyConversionsUsed;
        const limit = TIER_LIMITS[user.accountTier as AccountTier].conversionsPerDay;

        if (limit !== -1 && currentUsage >= limit) {
          return NextResponse.json(
            { error: 'Daily conversion limit reached. Please upgrade your plan.' },
            { status: 429 }
          );
        }

        // Reset counter if new day
        if (isNewDay) {
          await prisma.user.update({
            where: { id: userId },
            data: { dailyConversionsUsed: 1, lastResetDate: now },
          });
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: { dailyConversionsUsed: { increment: 1 } },
          });
        }
      }
    }

    // Determine format category for queue routing
    const category = getFormatCategory(inputFormat);

    // Create job record in database
    const job = await prisma.job.create({
      data: {
        userId,
        inputFileKey,
        inputFormat,
        outputFormat,
        inputFileSize: BigInt(inputFileSize),
        qualityPreset,
        customSettings: customSettings || undefined,
        status: 'PENDING',
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Add to BullMQ queue
    await addConversionJob(
      {
        jobId: job.id,
        userId: userId || undefined,
        inputFileKey,
        inputFormat,
        outputFormat,
        inputFileSize,
        qualityPreset,
        customSettings,
      },
      tier
    );

    return NextResponse.json({
      jobId: job.id,
      status: 'PENDING',
      message: 'Conversion job queued successfully',
    });
  } catch (error) {
    console.error('Job create error:', error);
    return NextResponse.json({ error: 'Failed to create conversion job' }, { status: 500 });
  }
}
