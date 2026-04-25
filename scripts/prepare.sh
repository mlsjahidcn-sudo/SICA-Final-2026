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
if command -v pnpm &> /dev/null; then
    echo "pnpm version: $(pnpm --version)"
else
    echo "pnpm not found globally, will use npx pnpm..."
fi

echo "Installing dependencies..."
run_pnpm install --prefer-frozen-lockfile --prefer-offline
