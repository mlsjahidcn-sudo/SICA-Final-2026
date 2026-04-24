#!/bin/bash
# ============================================================
# Hostinger Deployment Start Script
# ============================================================
# This script starts the Next.js standalone server on Hostinger.
# It ensures correct environment variables are set.
# ============================================================

set -Eeuo pipefail

# Set workspace path
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

echo "=== Starting SICA on Hostinger ==="

# Set port (Hostinger typically uses PORT env var)
PORT="${PORT:-5000}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# ============================================================
# CRITICAL: Export correct Supabase credentials
# These MUST be set before starting the server.
# System env vars may have wrong values that override .env files.
# ============================================================
export COZE_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export COZE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export COZE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY"
export NEXT_PUBLIC_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export NODE_ENV=production
export PORT=${DEPLOY_RUN_PORT}
export HOSTNAME="0.0.0.0"

echo "Port: ${PORT}"
echo "Supabase URL: ${COZE_SUPABASE_URL}"

# ============================================================
# Find the standalone server.js
# ============================================================
SERVER_DIR=""
if [ -f ".next/standalone/workspace/projects/server.js" ]; then
    SERVER_DIR=".next/standalone/workspace/projects"
elif [ -f ".next/standalone/server.js" ]; then
    SERVER_DIR=".next/standalone"
fi

if [ -z "${SERVER_DIR}" ]; then
    echo "ERROR: No standalone server.js found!"
    echo "Did you run build-hostinger.sh first?"
    exit 1
fi

echo "Server directory: ${SERVER_DIR}"

# ============================================================
# Ensure static assets exist
# ============================================================
if [ -d "public" ]; then
    cp -rn public "${SERVER_DIR}/public" 2>/dev/null || true
fi
if [ -d ".next/static" ]; then
    mkdir -p "${SERVER_DIR}/.next"
    cp -rn .next/static "${SERVER_DIR}/.next/static" 2>/dev/null || true
fi

# ============================================================
# Write production env file (override any placeholders)
# ============================================================
cat > "${SERVER_DIR}/.env.production" << 'ENVEOF'
COZE_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY
NEXT_PUBLIC_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
NODE_ENV=production
ENVEOF

# ============================================================
# Start the server
# ============================================================
cd "${SERVER_DIR}"
echo "Starting from: $(pwd)"
echo "PORT=${PORT} HOSTNAME=${HOSTNAME}"
exec node server.js
