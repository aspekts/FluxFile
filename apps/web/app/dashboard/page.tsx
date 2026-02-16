import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { prisma } from '@fluxfile/db';
import { ConversionHistory } from '@/components/dashboard/conversion-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIER_LIMITS } from '@fluxfile/config';
import type { AccountTier } from '@fluxfile/types';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      accountTier: true,
      dailyConversionsUsed: true,
      lastResetDate: true,
    },
  });

  if (!user) redirect('/login');

  const tier = user.accountTier as AccountTier;
  const limits = TIER_LIMITS[tier];

  // Reset counter if new day
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  const isNewDay = now.toDateString() !== lastReset.toDateString();
  const dailyUsed = isNewDay ? 0 : user.dailyConversionsUsed;

  // Fetch recent jobs
  const recentJobs = await prisma.job.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      inputFormat: true,
      outputFormat: true,
      inputFileSize: true,
      outputFileSize: true,
      status: true,
      progress: true,
      currentStage: true,
      createdAt: true,
      completedAt: true,
      processingTimeMs: true,
      errorMessage: true,
    },
  });

  // Serialize BigInts
  const serializedJobs = recentJobs.map((job) => ({
    ...job,
    inputFileSize: job.inputFileSize.toString(),
    outputFileSize: job.outputFileSize?.toString() || null,
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name || user.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={tier === 'PRO' || tier === 'ENTERPRISE' ? 'default' : 'secondary'}>
              {tier}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyUsed}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {limits.conversionsPerDay === -1 ? 'Unlimited' : limits.conversionsPerDay}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(limits.maxFileSize / (1024 * 1024))} MB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionHistory jobs={serializedJobs} />
        </CardContent>
      </Card>
    </div>
  );
}
