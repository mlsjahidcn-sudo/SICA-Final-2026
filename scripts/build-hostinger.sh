#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Building for Hostinger (using pnpm)..."

# Use pnpm as specified in packageManager
echo "Installing dependencies..."
pnpm install

echo "Building the Next.js project (standalone mode)..."
pnpm run build:next

# Check if standalone output exists
if [ -d ".next/standalone" ]; then
    echo "Standalone build created successfully at .next/standalone"

    # Copy static files and public folder to standalone
    echo "Copying static assets to standalone directory..."
    cp -r public .next/standalone/public 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
else
    echo "Warning: Standalone directory not found. Build may have issues."
fi

echo "Build completed successfully!"
