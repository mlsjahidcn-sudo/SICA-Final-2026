#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Building for Hostinger..."

# Clean up pnpm artifacts that conflict with npm
if [ -d "node_modules/.pnpm" ]; then
    echo "Removing pnpm artifacts..."
    rm -rf node_modules/.pnpm
fi

# Also remove pnpm-lock.yaml if it exists
if [ -f "pnpm-lock.yaml" ]; then
    echo "Removing pnpm lock file..."
    rm -f pnpm-lock.yaml
fi

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building the Next.js project (standalone mode)..."
npm run build:next

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
