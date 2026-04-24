#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

# Use PORT from environment or default to 5000
PORT="${PORT:-5000}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "Current directory: $(pwd)"
echo "Starting server on port: ${DEPLOY_RUN_PORT}"

# Export correct Supabase credentials (system env may override .env.local with wrong values)
export COZE_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export COZE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export COZE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY"

echo "Supabase URL: ${COZE_SUPABASE_URL}"

# Check for standalone build first (for shared hosting like Hostinger)
if [ -f ".next/standalone/server.js" ]; then
    echo "Found Next.js standalone server..."
    
    # Ensure directories exist
    mkdir -p .next/standalone/public
    mkdir -p .next/standalone/.next/static
    
    # Copy static files if they exist
    if [ -d "public" ]; then
        cp -r public .next/standalone/ 2>/dev/null || true
    fi
    if [ -d ".next/static" ]; then
        cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    fi
    
    cd .next/standalone
    echo "Starting server from: $(pwd)"
    
    # Start the server - Next.js standalone uses PORT and HOSTNAME env vars
    export PORT=${DEPLOY_RUN_PORT}
    export HOSTNAME="0.0.0.0"
    
    echo "Environment: PORT=${PORT}, HOSTNAME=${HOSTNAME}"
    exec node server.js
elif [ -f "dist/server.js" ]; then
    echo "Found custom server..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
else
    echo "Error: No server found. Looking for:"
    echo "  - .next/standalone/server.js"
    echo "  - dist/server.js"
    echo ""
    echo "Directory contents:"
    ls -la
    exit 1
fi
