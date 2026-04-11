#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found, installing via corepack..."
    # Try corepack first (Node.js 16.9+)
    if command -v corepack &> /dev/null; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        # Fallback to npm install
        echo "corepack not found, installing pnpm via npm..."
        npm install -g pnpm@latest
    fi
fi

echo "pnpm version: $(pnpm --version)"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
