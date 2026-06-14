#!/bin/sh
set -e
cd /app/backend
npx prisma db push --accept-data-loss
node scripts/maybe-seed.mjs
exec "$@"
