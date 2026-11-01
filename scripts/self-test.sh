#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
echo "== typecheck"
npm run typecheck
echo "== unit tests"
npm test
echo "== architecture fitness"
npm run architecture:fitness
echo "== production build"
npm run build
echo "self-test OK"
