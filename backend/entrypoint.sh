#!/bin/sh
set -e

# Run migrations and seed only if RUN_MIGRATIONS is set
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  bunx prisma db push --skip-generate
  echo "Seeding database..."
  bun run prisma/seed.ts
  echo "Database ready."
fi

# Start the service
exec "$@"
