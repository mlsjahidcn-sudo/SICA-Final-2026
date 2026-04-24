#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# Export correct Supabase credentials for build-time env resolution
export COZE_SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
export COZE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4"
export COZE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY"

# Function to run pnpm (handles both installed and pnpm fallback)
run_pnpm() {
    if command -v pnpm &> /dev/null; then
        pnpm "$@"
    else
        pnpm pnpm "$@"
    fi
}

echo "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found globally, will use pnpm pnpm..."
    if command -v corepack &> /dev/null; then
        echo "Attempting corepack enable (may fail on shared hosting)..."
        corepack enable 2>/dev/null || true
    fi
fi

# Verify pnpm works
if command -v pnpm &> /dev/null; then
    echo "pnpm version: $(pnpm --version)"
else
    echo "Using pnpm pnpm (no global install needed)"
fi

echo "Installing dependencies..."
run_pnpm install --prefer-frozen-lockfile --prefer-offline

echo "Building the Next.js project (standalone mode)..."
run_pnpm next build

# Check if standalone output exists and copy assets to correct location
if [ -d ".next/standalone" ]; then
    echo "Standalone build created successfully at .next/standalone"
    
    # Determine the actual server directory (Next.js may nest it under workspace/projects/)
    SERVER_DIR=""
    if [ -f ".next/standalone/server.js" ]; then
        SERVER_DIR=".next/standalone"
    elif [ -f ".next/standalone/workspace/projects/server.js" ]; then
        SERVER_DIR=".next/standalone/workspace/projects"
    fi
    
    if [ -n "${SERVER_DIR}" ]; then
        echo "Server directory: ${SERVER_DIR}"
        
        # Copy static files and public folder to the correct standalone directory
        echo "Copying static assets to standalone directory..."
        cp -r public "${SERVER_DIR}/public" 2>/dev/null || true
        cp -r .next/static "${SERVER_DIR}/.next/static" 2>/dev/null || true
        
        # Write correct .env.production with real credentials
        echo "Writing production environment file..."
        cat > "${SERVER_DIR}/.env.production" << 'ENVEOF'
COZE_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY
NEXT_PUBLIC_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzc4MTMsImV4cCI6MjA5MTE1MzgxM30.tfWBBDlwo17Y5luljRNxmVpupj9rChZhcQxDQ-hvbc4
NODE_ENV=production
ENVEOF
        
        echo "Production env file written to ${SERVER_DIR}/.env.production"
    else
        echo "Warning: Could not find server.js in standalone output"
    fi
else
    echo "Warning: Standalone directory not found. Build may have issues."
fi

echo "Build completed successfully!"
