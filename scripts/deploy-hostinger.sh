#!/bin/bash
# Complete Hostinger Deployment Script
# This script handles all aspects of deployment on Hostinger shared hosting

set -Eeuo pipefail

echo "=========================================="
echo "  SICA Application - Hostinger Deployment"
echo "=========================================="

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null || echo "not found")
if [[ "$NODE_VERSION" == "not found" ]]; then
    print_error "Node.js is not installed!"
    exit 1
fi
print_info "Node.js version: $NODE_VERSION"

# Step 2: Check available memory
print_info "Checking system resources..."
if command -v free &> /dev/null; then
    free -h
else
    print_warn "Cannot check memory on this system"
fi

# Step 3: Clean previous builds
print_info "Cleaning previous builds..."
rm -rf .next node_modules/.cache 2>/dev/null || true

# Step 4: Install dependencies
print_info "Installing dependencies with npm..."
print_info "This may take a few minutes..."

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    print_info "Found package-lock.json, using npm ci for faster install..."
    npm ci --legacy-peer-deps || {
        print_warn "npm ci failed, falling back to npm install..."
        npm install --legacy-peer-deps
    }
else
    print_info "No package-lock.json found, using npm install..."
    npm install --legacy-peer-deps
fi

# Step 5: Check environment variables
print_info "Checking environment variables..."
if [ ! -f ".env.local" ]; then
    print_warn ".env.local not found!"
    if [ -f ".env.production" ]; then
        print_info "Copying .env.production to .env.local..."
        cp .env.production .env.local
        print_warn "Please edit .env.local with your actual values!"
    else
        print_error "No environment file found. Please create .env.local manually."
        exit 1
    fi
else
    print_info ".env.local found"
fi

# Verify critical environment variables
if [ -z "${COZE_SUPABASE_URL:-}" ]; then
    print_error "COZE_SUPABASE_URL is not set in .env.local"
    exit 1
fi

# Step 6: Build the application
print_info "Building Next.js application (standalone mode)..."
print_info "This may take 5-10 minutes on shared hosting..."

# Set NODE_ENV
export NODE_ENV=production

# Build with memory optimization
NODE_OPTIONS="--max_old_space_size=2048" npm run build:next || {
    print_error "Build failed!"
    print_info "Checking for common issues..."
    
    # Check if it's a memory issue
    if dmesg 2>/dev/null | tail -20 | grep -i "out of memory"; then
        print_error "Build failed due to insufficient memory."
        print_info "Try running: NODE_OPTIONS='--max_old_space_size=1536' npm run build:next"
    fi
    
    exit 1
}

# Step 7: Verify build output
print_info "Verifying build output..."
if [ ! -d ".next/standalone" ]; then
    print_error "Build failed: .next/standalone directory not found"
    exit 1
fi

print_info "Build successful!"

# Step 8: Copy static files
print_info "Copying static assets to standalone directory..."
mkdir -p .next/standalone/public
mkdir -p .next/standalone/.next/static

if [ -d "public" ]; then
    cp -r public/* .next/standalone/public/ 2>/dev/null || true
    print_info "Public files copied"
fi

if [ -d ".next/static" ]; then
    cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true
    print_info "Static files copied"
fi

# Step 9: Create logs directory
mkdir -p logs

# Step 10: Generate deployment info
cat > .next/standalone/deployment-info.txt <<EOF
Deployment Date: $(date)
Node.js Version: $(node -v)
npm Version: $(npm -v)
Build Path: $(pwd)
Port: ${PORT:-3000}
EOF

print_info "Deployment info saved to .next/standalone/deployment-info.txt"

# Step 11: Final checks
print_info "Performing final checks..."

# Check if server.js exists
if [ ! -f ".next/standalone/server.js" ]; then
    print_error "server.js not found in standalone build!"
    exit 1
fi

# Check file permissions
chmod -R 755 .next/standalone 2>/dev/null || true

print_info "=========================================="
print_info "  ✅ BUILD COMPLETED SUCCESSFULLY!"
print_info "=========================================="
echo ""
print_info "Next steps:"
echo "1. Verify .env.local has all required variables"
echo "2. Start the application with one of these commands:"
echo ""
echo "   Option A (Direct):"
echo "     PORT=3000 node .next/standalone/server.js"
echo ""
echo "   Option B (with PM2, if available):"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save"
echo ""
echo "3. Check logs at:"
echo "     tail -f logs/pm2-out.log"
echo "     tail -f logs/pm2-error.log"
echo ""
print_info "For troubleshooting, see HOSTINGER_DEPLOYMENT.md"
