#!/bin/sh
set -e
cd /app
echo "StockWise API: preparing database..."
npx prisma db push --accept-data-loss
node scripts/maybe-seed.mjs
echo "StockWise API: starting server on port ${PORT:-3001}..."
exec "$@"
