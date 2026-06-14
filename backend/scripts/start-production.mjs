import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

console.log('Applying database schema...');
run('npx prisma db push --accept-data-loss');

run('node scripts/maybe-seed.mjs');

console.log('Starting API server...');
run('node dist/index.js');
