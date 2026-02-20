#!/bin/sh
# Run from repo root so npm finds package.json. Render may run from a subdir.
set -e
if [ ! -f package.json ]; then
  if [ -f ../package.json ]; then
    cd ..
  elif [ -f ../../package.json ]; then
    cd ../..
  fi
fi
if [ ! -f package.json ]; then
  echo "ERROR: package.json not found. Repo root must contain package.json."
  exit 1
fi
npm install
npx prisma generate --schema=apps/api/src/infra/prisma/schema.prisma
npm run build:api
