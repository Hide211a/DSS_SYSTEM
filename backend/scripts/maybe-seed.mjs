import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const root = new URL('..', import.meta.url).pathname;

async function main() {
  const prisma = new PrismaClient();
  try {
    const categories = await prisma.category.count();
    if (categories === 0 || process.env.FORCE_DB_SEED === 'true') {
      console.log('Seeding database (empty or FORCE_DB_SEED=true)...');
      execSync('npx tsx prisma/seed.ts', { cwd: root, stdio: 'inherit' });
    } else {
      console.log('Database already seeded — skipping seed.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
