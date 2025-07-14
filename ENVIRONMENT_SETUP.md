# Environment Variables Configuration Guide

This document outlines all required environment variables for the Adopt Bamboo Dashboard.

## Required Environment Variables

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```
**Example for Neon Database:**
```
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### ToyyibPay Payment Gateway
```
TOYYIBPAY_SECRET_KEY=your_toyyibpay_secret_key
TOYYIBPAY_CATEGORY_CODE=your_category_code
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com
```

### Next.js Configuration
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
```

## Vercel Deployment Setup

### 1. Via Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its corresponding value
4. Set the environment (Production, Preview, Development)

### 2. Via Vercel CLI
```bash
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
# ... add all other variables
```

## Local Development Setup

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/adoptbamboo"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# ToyyibPay
TOYYIBPAY_SECRET_KEY="your_secret_key"
TOYYIBPAY_CATEGORY_CODE="your_category_code"
TOYYIBPAY_BASE_URL="https://dev.toyyibpay.com"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_local_secret"
```

## Database Setup Options

### Option 1: Neon Database (Recommended for Vercel)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables

### Option 2: Supabase
1. Sign up at https://supabase.com
2. Create a new project
3. Get the database URL from Settings → Database
4. Add to Vercel environment variables

### Option 3: PlanetScale
1. Sign up at https://planetscale.com
2. Create a new database
3. Get the connection string
4. Add to Vercel environment variables

## Troubleshooting

### Build Errors
- Ensure all required environment variables are set in Vercel
- Check that variable names match exactly (case-sensitive)
- Verify database connection string format

### Runtime Errors
- Check Vercel function logs for detailed error messages
- Ensure database is accessible from Vercel's IP ranges
- Verify API keys are valid and not expired

## Security Best Practices

1. **Never commit secrets to Git**
2. **Use different keys for development/production**
3. **Rotate keys regularly**
4. **Use Vercel's encrypted environment variables**
5. **Limit database access to necessary IP ranges**

## Quick Fix Commands

```bash
# Check current environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Deploy with fresh environment
vercel --prod
```