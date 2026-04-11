#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

# Check for standalone build first (for shared hosting like Hostinger)
if [ -f ".next/standalone/server.js" ]; then
    echo "Starting Next.js standalone server on port ${DEPLOY_RUN_PORT}..."
    mkdir -p .next/standalone/public
    mkdir -p .next/standalone/.next/static
    cp -r public .next/standalone/ 2>/dev/null || true
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    cd .next/standalone
    PORT=${DEPLOY_RUN_PORT} HOSTNAME="0.0.0.0" node server.js
elif [ -f "dist/server.js" ]; then
    echo "Starting custom server on port ${DEPLOY_RUN_PORT}..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
else
    echo "Error: No server found. Build the project first."
    exit 1
fi
