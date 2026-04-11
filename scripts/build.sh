#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# Function to run pnpm (handles both installed and npx fallback)
run_pnpm() {
    if command -v pnpm &> /dev/null; then
        pnpm "$@"
    else
        npx pnpm "$@"
    fi
}

echo "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found globally, will use npx pnpm..."
    # Try corepack enable (might fail due to permissions, ignore error)
    if command -v corepack &> /dev/null; then
        echo "Attempting corepack enable (may fail on shared hosting)..."
        corepack enable 2>/dev/null || true
    fi
fi

# Verify pnpm works
if command -v pnpm &> /dev/null; then
    echo "pnpm version: $(pnpm --version)"
else
    echo "Using npx pnpm (no global install needed)"
fi

echo "Installing dependencies..."
run_pnpm install --prefer-frozen-lockfile --prefer-offline

echo "Building the Next.js project (standalone mode)..."
run_pnpm next build

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
