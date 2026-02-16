import { PrismaClient, AccountTier, UserRole, EnterpriseStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fluxfile.aspekts.dev' },
    update: {},
    create: {
      email: 'admin@fluxfile.aspekts.dev',
      name: 'FluxFile Admin',
      emailVerified: true,
      accountTier: AccountTier.ENTERPRISE,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample free user
  const freeUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Free User',
      emailVerified: true,
      accountTier: AccountTier.FREE,
      role: UserRole.USER,
    },
  });
  console.log('✅ Created free user:', freeUser.email);

  // Create sample enterprise
  const enterprise = await prisma.enterprise.upsert({
    where: { id: 'demo-enterprise' },
    update: {},
    create: {
      id: 'demo-enterprise',
      companyName: 'Aspekts Demo Corp',
      status: EnterpriseStatus.ACTIVE,
      contractStartDate: new Date(),
      contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      monthlyFeeUSD: 999,
      billingEmail: 'billing@aspekts.dev',
      salesContactEmail: 'sales@aspekts.dev',
      dailyQuotaOverride: null, // unlimited
      auditLogsEnabled: true,
      priorityQueue: true,
    },
  });
  console.log('✅ Created demo enterprise:', enterprise.companyName);

  // Create enterprise user
  const enterpriseUser = await prisma.user.upsert({
    where: { email: 'enterprise@example.com' },
    update: {},
    create: {
      email: 'enterprise@example.com',
      name: 'Enterprise User',
      emailVerified: true,
      accountTier: AccountTier.ENTERPRISE,
      role: UserRole.ENTERPRISE,
      enterpriseId: enterprise.id,
    },
  });
  console.log('✅ Created enterprise user:', enterpriseUser.email);

  // Create sample jobs for demonstration
  const sampleJob = await prisma.job.create({
    data: {
      userId: freeUser.id,
      inputFileKey: 'uploads/sample-audio.mp3',
      inputFormat: 'mp3',
      outputFormat: 'wav',
      inputFileSize: BigInt(5242880), // 5MB
      status: 'COMPLETED',
      progress: 100,
      queuedAt: new Date(Date.now() - 3600000), // 1 hour ago
      startedAt: new Date(Date.now() - 3540000),
      completedAt: new Date(Date.now() - 3480000),
      processingTimeMs: 60000, // 1 minute
      outputFileKey: 'results/sample-audio.wav',
      outputFileSize: BigInt(52428800), // 50MB
      downloadExpiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    },
  });
  console.log('✅ Created sample completed job:', sampleJob.id);

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📝 Development credentials:');
  console.log('   Admin: admin@fluxfile.aspekts.dev');
  console.log('   Free User: user@example.com');
  console.log('   Enterprise User: enterprise@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
