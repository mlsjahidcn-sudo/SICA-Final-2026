# Hostinger Deployment Guide

## 🚀 Deployment Options for Hostinger

Hostinger shared hosting has limitations:
- ❌ No pnpm support (corepack enable fails due to permissions)
- ❌ No root access
- ✅ Node.js 18/20 support via SSH
- ✅ npm available

### Option 1: Deploy via SSH (Recommended)

#### Step 1: Connect via SSH

```bash
ssh u863228546@lawngreen-fox-388897.hostingersite.com
```

#### Step 2: Navigate to deployment directory

```bash
cd ~/domains/lawngreen-fox-388897.hostingersite.com/public_html
```

#### Step 3: Clone your repository

```bash
git clone -b Codebuddy https://github.com/mlsjahidcn-sudo/SICA-Final-2026.git .
```

#### Step 4: Install dependencies with npm

```bash
npm install --legacy-peer-deps
```

#### Step 5: Build the application

```bash
npm run build:next
```

#### Step 6: Set environment variables

Create `.env.local` file:

```bash
nano .env.local
```

Add your environment variables:

```bash
COZE_SUPABASE_URL=https://maqzxlcsgfpwnfyleoga.supabase.co
COZE_SUPABASE_ANON_KEY=sb_publishable_bKdGK7kPf38oTLPNJJy-ZA_g1PcgEBU
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY
DATABASE_URL=postgresql://postgres:PASSWORD@db.maqzxlcsgfpwnfyleoga.supabase.co:5432/postgres
MOONSHOT_API_KEY=sk-0hlSvDQumVyMEGlOvbo2ydXrrG7FruTweyzIdwNqS6GoBrQB
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
MOONSHOT_MODEL=kimi-k2.5
NEXT_PUBLIC_APP_URL=https://lawngreen-fox-388897.hostingersite.com
NEXT_PUBLIC_SITE_URL=https://lawngreen-fox-388897.hostingersite.com
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

#### Step 7: Start the application

**Important**: Hostinger shared hosting typically runs on port 3000 or you need to use a specific port provided by Hostinger.

```bash
# Check available Node.js version
node -v

# Start the standalone server
PORT=3000 node .next/standalone/server.js
```

**Or use PM2 (if available):**

```bash
# Install PM2 globally (if you have permission)
npm install -g pm2

# Start with PM2
pm2 start .next/standalone/server.js --name "sica-app"

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
```

### Option 2: Deploy via Git Integration

If Hostinger provides a Git integration in hPanel:

1. Go to **hPanel** → **Website** → **Git**
2. Connect your GitHub repository: `https://github.com/mlsjahidcn-sudo/SICA-Final-2026`
3. Select branch: `Codebuddy`
4. Set deployment settings:
   - Build command: `npm install --legacy-peer-deps && npm run build:next`
   - Start command: `node .next/standalone/server.js`
   - Port: `3000` (or as specified by Hostinger)
5. Add environment variables in the Git integration settings

### Option 3: Use Docker (VPS or Cloud Hosting)

If you have Hostinger VPS or cloud hosting:

```bash
# Build Docker image
docker build -f Dockerfile.hostinger -t sica-app .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name sica-container \
  sica-app
```

## 🔧 Alternative: Use Vercel or Netlify (Recommended for Next.js)

Since Hostinger shared hosting has limitations, consider deploying to:

### **Vercel (Best for Next.js)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add COZE_SUPABASE_URL
vercel env add COZE_SUPABASE_ANON_KEY
# ... add all env vars
```

### **Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build:next

# Deploy
netlify deploy --prod
```

### **Railway.app**

```bash
# Connect GitHub repo
# Railway auto-detects Next.js
# Set environment variables in dashboard
```

## 🐛 Troubleshooting

### Error: `pnpm: command not found`

**Solution**: Use npm commands instead:
```bash
npm install --legacy-peer-deps
npm run build:next
```

### Error: `EACCES: permission denied`

**Solution**: This is a Hostinger limitation. Use npm instead of pnpm, or upgrade to VPS.

### Error: `Port 3000 already in use`

**Solution**: Use a different port:
```bash
PORT=3001 node .next/standalone/server.js
```

### Application doesn't start

**Check logs**:
```bash
# If using PM2
pm2 logs sica-app

# If running directly
node .next/standalone/server.js
```

## 📋 Quick Deployment Checklist

- [ ] Clone repository (branch: `Codebuddy`)
- [ ] Create `.env.local` with all required variables
- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Build application: `npm run build:next`
- [ ] Start server: `node .next/standalone/server.js`
- [ ] Configure domain/subdomain in Hostinger
- [ ] Set up SSL certificate (via hPanel)
- [ ] Test application: `https://your-domain.com`

## 🌐 Domain Configuration

### Configure Subdomain (if needed)

1. Go to **hPanel** → **Domains** → **Subdomains**
2. Create subdomain (e.g., `app.yourdomain.com`)
3. Point document root to your application directory
4. Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` in `.env.local`

### Configure SSL

1. Go to **hPanel** → **SSL** → **Let's Encrypt**
2. Install free SSL certificate for your domain
3. Force HTTPS in Next.js config (already configured)

## 💡 Pro Tips

1. **Use PM2** for process management (if available)
2. **Set up automatic deployments** via Git integration
3. **Monitor logs** regularly: `pm2 logs` or check error logs
4. **Use caching** for better performance (already optimized)
5. **Consider VPS** if shared hosting is too restrictive

## 🚨 Known Limitations on Hostinger Shared Hosting

- ❌ No pnpm support
- ❌ No root/sudo access
- ❌ Limited memory and CPU
- ❌ May have process time limits
- ✅ Works with npm
- ✅ Node.js support via SSH
- ✅ Git integration available

## 📞 Need Help?

If deployment still fails:
1. Check Hostinger's Node.js documentation
2. Contact Hostinger support for port/environment configuration
3. Consider using Vercel/Netlify/Railway for easier deployment
