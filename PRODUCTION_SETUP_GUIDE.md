# Production Setup Guide for Adopt Bamboo System

This guide covers the remaining steps to complete your production deployment on aaPanel.

## Current Status ✅
- PM2 process `adoptbamboo` is running
- Application files deployed to `/www/wwwroot/adopta.bambooinnovasia.com`
- Dependencies installed
- PM2 configuration active

## Next Steps

### 1. Configure Reverse Proxy (Nginx)

In aaPanel:
1. Go to **Website** → **Site Settings** → **Reverse Proxy**
2. Add new proxy:
   - **Proxy Name**: `adoptbamboo`
   - **Target URL**: `http://127.0.0.1:3000`
   - **Send Domain**: `adopta.bambooinnovasia.com`
3. Enable the proxy

### 2. Domain DNS Configuration

Ensure your domain DNS points to your server:
- **A Record**: `adopta.bambooinnovasia.com` → Your server IP
- **CNAME Record** (optional): `www.adopta.bambooinnovasia.com` → `adopta.bambooinnovasia.com`

### 3. SSL Certificate

In aaPanel:
1. Go to **Website** → **Site Settings** → **SSL**
2. Choose **Let's Encrypt** for free SSL
3. Enter your domain and email
4. Click **Apply**
5. Enable **Force HTTPS**

### 4. Environment Variables Setup

**CRITICAL**: Create `.env` file in `/www/wwwroot/adopta.bambooinnovasia.com/`:

```bash
# Database
DATABASE_URL="your_production_database_url"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_production_clerk_key"
CLERK_SECRET_KEY="your_production_clerk_secret"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# ToyyibPay
TOYYIBPAY_SECRET_KEY="your_production_toyyibpay_key"
TOYYIBPAY_CATEGORY_CODE="your_production_category_code"

# App Configuration
NEXT_PUBLIC_APP_URL="https://adopta.bambooinnovasia.com"
NODE_ENV="production"
```

### 5. Restart PM2

After adding environment variables:
```bash
cd /www/wwwroot/adopta.bambooinnovasia.com
pm2 restart adoptbamboo
pm2 save
```

### 6. Final Verification

1. **Check PM2 Status**:
   ```bash
   pm2 status
   pm2 logs adoptbamboo
   ```

2. **Test Application**:
   - Visit `https://adopta.bambooinnovasia.com`
   - Test user registration/login
   - Test bamboo adoption process
   - Test payment flow

3. **Health Check**:
   ```bash
   curl https://adopta.bambooinnovasia.com/api/health
   ```

## Additional Production Features

### Security Hardening
- Enable firewall rules
- Configure rate limiting
- Set up fail2ban
- Regular security updates

### Monitoring
- Set up PM2 monitoring: `pm2 monitor`
- Configure log rotation
- Set up uptime monitoring

### Backup Strategy
- Database backups
- File system backups
- Environment variables backup

### Performance Optimization
- Enable Nginx gzip compression
- Configure caching headers
- Optimize database queries
- Set up CDN for static assets

## Troubleshooting

If you encounter issues:
1. Check PM2 logs: `pm2 logs adoptbamboo`
2. Verify environment variables
3. Test database connectivity
4. Check Nginx configuration
5. Verify SSL certificate

## Support

For additional help:
- Check application logs in `/www/wwwroot/adopta.bambooinnovasia.com/logs/`
- Review PM2 process status
- Verify all environment variables are set correctly