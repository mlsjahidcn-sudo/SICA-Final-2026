#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT="${PORT:-5000}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "=== SICA Start Script ==="
echo "Directory: $(pwd)"
echo "Port: ${DEPLOY_RUN_PORT}"

# Export correct Supabase credentials (system env may override .env.local with wrong values)
export COZE_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export COZE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export COZE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY"
export NEXT_PUBLIC_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export NODE_ENV=production

echo "Supabase URL: ${COZE_SUPABASE_URL}"

# Determine correct standalone server path
SERVER_DIR=""
if [ -f ".next/standalone/workspace/projects/server.js" ]; then
    SERVER_DIR=".next/standalone/workspace/projects"
    echo "Found server at: ${SERVER_DIR}/server.js (nested path)"
elif [ -f ".next/standalone/server.js" ]; then
    SERVER_DIR=".next/standalone"
    echo "Found server at: ${SERVER_DIR}/server.js (direct path)"
fi

if [ -n "${SERVER_DIR}" ]; then
    # Ensure static assets exist in the standalone directory
    echo "Ensuring static assets are in place..."
    
    # Copy public folder if standalone's public is empty or missing
    if [ -d "public" ] && [ ! -d "${SERVER_DIR}/public" ]; then
        cp -r public "${SERVER_DIR}/public"
        echo "Copied public/ to standalone"
    fi
    
    # Copy .next/static if standalone's static is missing
    if [ -d ".next/static" ] && [ ! -d "${SERVER_DIR}/.next/static" ]; then
        mkdir -p "${SERVER_DIR}/.next"
        cp -r .next/static "${SERVER_DIR}/.next/static"
        echo "Copied .next/static/ to standalone"
    fi
    
    # Ensure .env.production has correct values (override any placeholders)
    echo "Writing production env file..."
    cat > "${SERVER_DIR}/.env.production" << 'ENVEOF'
COZE_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY
NEXT_PUBLIC_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
NODE_ENV=production
ENVEOF
    
    cd "${SERVER_DIR}"
    echo "Starting server from: $(pwd)"
    
    # Set port and hostname for Next.js standalone server
    export PORT=${DEPLOY_RUN_PORT}
    export HOSTNAME="0.0.0.0"
    
    echo "Environment: PORT=${PORT}, HOSTNAME=${HOSTNAME}, NODE_ENV=${NODE_ENV}"
    echo "Supabase URL: ${COZE_SUPABASE_URL}"
    
    exec node server.js
else
    echo "ERROR: No standalone server.js found!"
    echo "Searched:"
    echo "  - .next/standalone/workspace/projects/server.js"
    echo "  - .next/standalone/server.js"
    echo ""
    echo "Directory listing:"
    ls -la .next/standalone/ 2>/dev/null || echo "  .next/standalone/ not found"
    find .next/standalone -name "server.js" 2>/dev/null || echo "  No server.js found anywhere"
    exit 1
fi
