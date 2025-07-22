# Troubleshooting 500 Internal Server Error

This guide helps diagnose and fix the "Internal Server Error" on your production site.

## Immediate Actions

### 1. Check PM2 Status and Logs

```bash
# Check if the application is running
pm2 status

# View real-time logs
pm2 logs adoptbamboo

# View error logs specifically
pm2 logs adoptbamboo --err

# View recent logs
pm2 logs adoptbamboo --lines 50
```

### 2. Check Application Logs

```bash
# Navigate to your application directory
cd /www/wwwroot/adopta.bambooinnovasia.com

# Check if logs directory exists
ls -la logs/

# View error logs
tail -f logs/err.log
tail -f logs/out.log
tail -f logs/combined.log
```

### 3. Test Direct Application Access

```bash
# Test if the app responds on localhost
curl http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health

# Check if port 3000 is listening
netstat -tlnp | grep :3000
```

## Common Causes and Solutions

### 1. Missing Environment Variables

**Problem**: `.env` file missing or incomplete

**Solution**:
```bash
# Check if .env exists
ls -la /www/wwwroot/adopta.bambooinnovasia.com/.env

# Create .env file with required variables
cat > /www/wwwroot/adopta.bambooinnovasia.com/.env << 'EOF'
DATABASE_URL="your_database_url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_key"
CLERK_SECRET_KEY="your_clerk_secret"
TOYYIBPAY_SECRET_KEY="your_toyyibpay_key"
TOYYIBPAY_CATEGORY_CODE="your_category_code"
NEXT_PUBLIC_APP_URL="https://adopta.bambooinnovasia.com"
NODE_ENV="production"
EOF

# Restart PM2
pm2 restart adoptbamboo
```

### 2. Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
```bash
# Test database connection
node -e "console.log(process.env.DATABASE_URL)"

# Check if database URL is accessible
# (Replace with your actual database URL)
curl -I "your_database_url"
```

### 3. Missing Dependencies

**Problem**: Node modules not installed or corrupted

**Solution**:
```bash
cd /www/wwwroot/adopta.bambooinnovasia.com

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart PM2
pm2 restart adoptbamboo
```

### 4. Build Issues

**Problem**: Next.js build files missing or corrupted

**Solution**:
```bash
cd /www/wwwroot/adopta.bambooinnovasia.com

# Clean and rebuild
rm -rf .next
npm run build

# Restart PM2
pm2 restart adoptbamboo
```

### 5. File Permissions

**Problem**: Incorrect file permissions

**Solution**:
```bash
# Fix ownership (replace 'www' with your web user)
chown -R www:www /www/wwwroot/adopta.bambooinnovasia.com

# Fix permissions
chmod -R 755 /www/wwwroot/adopta.bambooinnovasia.com
chmod 644 /www/wwwroot/adopta.bambooinnovasia.com/.env
```

### 6. Port Conflicts

**Problem**: Port 3000 already in use

**Solution**:
```bash
# Check what's using port 3000
lsof -i :3000

# Kill conflicting processes if needed
kill -9 <PID>

# Or change port in ecosystem.config.js
# Then restart PM2
pm2 restart adoptbamboo
```

## Step-by-Step Recovery Process

### Step 1: Environment Check
```bash
cd /www/wwwroot/adopta.bambooinnovasia.com
pwd
ls -la
cat .env 2>/dev/null || echo "No .env file found"
```

### Step 2: PM2 Diagnosis
```bash
pm2 status
pm2 describe adoptbamboo
pm2 logs adoptbamboo --lines 20
```

### Step 3: Application Test
```bash
# Stop PM2
pm2 stop adoptbamboo

# Try running directly
NODE_ENV=production npm start

# If it works, restart PM2
pm2 start ecosystem.config.js --env production
```

### Step 4: Network Test
```bash
# Test internal connection
curl -v http://localhost:3000

# Test external connection
curl -v https://adopta.bambooinnovasia.com
```

## Health Check Commands

```bash
# Complete system check
echo "=== PM2 Status ==="
pm2 status

echo "=== Environment Variables ==="
cat /www/wwwroot/adopta.bambooinnovasia.com/.env | grep -v SECRET | grep -v PASSWORD

echo "=== Port Check ==="
netstat -tlnp | grep :3000

echo "=== Recent Logs ==="
pm2 logs adoptbamboo --lines 10

echo "=== Disk Space ==="
df -h

echo "=== Memory Usage ==="
free -h
```

## Quick Recovery Script

Create and run this script for quick recovery:

```bash
#!/bin/bash
echo "Starting recovery process..."

# Navigate to app directory
cd /www/wwwroot/adopta.bambooinnovasia.com

# Stop PM2
pm2 stop adoptbamboo

# Reinstall dependencies
npm install

# Rebuild application
npm run build

# Start PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "Recovery complete. Check status with: pm2 status"
```

## When to Contact Support

Contact your hosting provider if:
- Server resources are exhausted
- Network connectivity issues persist
- File system errors occur
- Database server is unreachable

## Prevention

1. **Regular Monitoring**: Set up monitoring alerts
2. **Log Rotation**: Configure log rotation to prevent disk space issues
3. **Backup Strategy**: Regular backups of application and database
4. **Health Checks**: Implement automated health checks
5. **Resource Monitoring**: Monitor CPU, memory, and disk usage