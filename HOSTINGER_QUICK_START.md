# 🚀 Quick Start Guide for Hostinger Deployment

## 📋 Prerequisites

- ✅ Hostinger account with Node.js support
- ✅ SSH access enabled
- ✅ Git repository access

## ⚡ Quick Deployment (5 Steps)

### Step 1: SSH into Hostinger

```bash
ssh u863228546@lawngreen-fox-388897.hostingersite.com
```

### Step 2: Navigate to Document Root

```bash
cd ~/domains/lawngreen-fox-388897.hostingersite.com/public_html
```

### Step 3: Clone Repository

```bash
# Remove existing files if needed
rm -rf .[^.]* *

# Clone from GitHub
git clone -b Codebuddy https://github.com/mlsjahidcn-sudo/SICA-Final-2026.git .
```

### Step 4: Run Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy-hostinger.sh

# Run deployment
./scripts/deploy-hostinger.sh
```

### Step 5: Configure Environment & Start

```bash
# Edit environment variables
nano .env.local

# Start the application
PORT=3000 node .next/standalone/server.js
```

**That's it!** Your application should now be running at:
```
https://lawngreen-fox-388897.hostingersite.com
```

---

## 🔧 Troubleshooting

### Issue: Build Fails with "pnpm: command not found"

**Solution**: The build script now uses npm automatically. Pull the latest code:

```bash
git pull origin Codebuddy
./scripts/deploy-hostinger.sh
```

### Issue: Build Fails with Memory Error

**Solution**: Reduce Node.js memory limit:

```bash
NODE_OPTIONS='--max_old_space_size=1536' npm run build:next
```

### Issue: Port 3000 Already in Use

**Solution**: Use a different port:

```bash
PORT=3001 node .next/standalone/server.js
```

### Issue: Application Won't Start

**Check logs:**

```bash
# If using PM2
pm2 logs sica-app

# If running directly
node .next/standalone/server.js
```

---

## 📝 Environment Variables Checklist

Make sure these are set in `.env.local`:

- [x] `COZE_SUPABASE_URL`
- [x] `COZE_SUPABASE_ANON_KEY`
- [x] `COZE_SUPABASE_SERVICE_ROLE_KEY`
- [x] `DATABASE_URL`
- [x] `MOONSHOT_API_KEY`
- [x] `MOONSHOT_BASE_URL`
- [x] `MOONSHOT_MODEL`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_SITE_URL`

---

## 🎯 Deployment via Hostinger Git Integration

If Hostinger provides Git integration in hPanel:

1. **Git Repository**: `https://github.com/mlsjahidcn-sudo/SICA-Final-2026`
2. **Branch**: `Codebuddy`
3. **Build Command**: `./scripts/deploy-hostinger.sh`
4. **Start Command**: `node .next/standalone/server.js`
5. **Port**: `3000`

Add environment variables in the Git integration settings.

---

## 🔄 Updating the Application

```bash
# Pull latest changes
git pull origin Codebuddy

# Rebuild
./scripts/deploy-hostinger.sh

# Restart (if using PM2)
pm2 restart sica-app
```

---

## 💡 Pro Tips

1. **Use PM2 for Production** (if available on your plan):
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

2. **Monitor Logs**:
   ```bash
   # Real-time logs
   tail -f logs/pm2-out.log
   
   # Error logs
   tail -f logs/pm2-error.log
   ```

3. **Check Resource Usage**:
   ```bash
   # Memory usage
   free -h
   
   # Disk usage
   df -h
   
   # Running processes
   ps aux | grep node
   ```

4. **Backup Before Updates**:
   ```bash
   cp -r .next .next.backup
   cp .env.local .env.local.backup
   ```

---

## 📞 Need Help?

- 📖 Full documentation: `HOSTINGER_DEPLOYMENT.md`
- 🐛 Issues: Check logs in `logs/` directory
- 💬 Support: Contact Hostinger support for hosting-related issues

---

## ✅ Success Indicators

Your deployment is successful if you see:

1. ✅ Build completes without errors
2. ✅ `.next/standalone/server.js` exists
3. ✅ Server starts on port 3000
4. ✅ Website loads at your domain
5. ✅ No errors in logs

---

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Set correct file permissions (755 for dirs, 644 for files)
- [ ] Enable HTTPS (via Hostinger SSL)
- [ ] Keep `.env.local` secure (not in git)
- [ ] Regular security updates: `npm audit fix`

---

## 📊 Performance Optimization

The application already includes:

- ✅ Standalone build (smaller footprint)
- ✅ Static asset caching
- ✅ Optimized AI chat with caching
- ✅ Database query optimization

For even better performance:

1. Enable Hostinger's built-in caching
2. Use a CDN for static assets
3. Optimize images before upload

---

## 🎉 You're All Set!

Your SICA application is now ready for production on Hostinger!

For questions or issues, refer to `HOSTINGER_DEPLOYMENT.md` for detailed troubleshooting.
