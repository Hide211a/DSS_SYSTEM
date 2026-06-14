import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
copyFileSync(
  join(root, 'prisma/schema.postgres.prisma'),
  join(root, 'prisma/schema.prisma')
);
console.log('Using PostgreSQL Prisma schema for production build.');
