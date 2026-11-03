#!/bin/sh
set -e
npx prisma migrate deploy
if [ "$SEED" = "true" ]; then
  node dist/seed.js
fi
node dist/main.js
