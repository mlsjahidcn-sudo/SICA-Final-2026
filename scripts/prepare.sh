#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found, installing via corepack..."
    if command -v corepack &> /dev/null; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        echo "corepack not found, installing pnpm via npm..."
        npm install -g pnpm@latest
    fi
fi

echo "pnpm version: $(pnpm --version)"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only
