#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Building for Hostinger (using npm)..."

# Use npm instead of pnpm for shared hosting
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
