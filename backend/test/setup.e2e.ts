import { PrismaClient } from '@prisma/client';

// Set JWT_SECRET for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export async function setupE2E() {
  await prisma.$connect();
}

export async function teardownE2E() {
  await prisma.$disconnect();
}

export async function cleanupDatabase() {
  // Disable foreign key constraints temporarily
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  const tablenames = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE "public"."' + tablename + '" RESTART IDENTITY CASCADE;',
      );
    }
  }

  // Re-enable foreign key constraints
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
}

export { prisma };
