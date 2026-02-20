#!/bin/sh
# Start API from repo root (same as render-build.sh).
if [ ! -f package.json ]; then
  if [ -f ../package.json ]; then
    cd ..
  elif [ -f ../../package.json ]; then
    cd ../..
  fi
fi
exec npm run start:api
