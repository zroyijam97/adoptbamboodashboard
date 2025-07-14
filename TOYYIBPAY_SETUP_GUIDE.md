# ToyyibPay Setup Guide

## Current Issue
The payment is failing with "Invalid request parameters or authentication failed" because you're using production credentials with the sandbox environment.

## Root Cause
- Your app is configured to use sandbox URL: `https://dev.toyyibpay.com`
- But you're using production credentials that are not valid for sandbox
- ToyyibPay returns `[FALSE]` when credentials don't match the environment

## Solution: Set Up Sandbox Environment

### Step 1: Create Sandbox Account
1. Go to https://dev.toyyibpay.com
2. Register a new account (separate from production)
3. Complete the registration process

### Step 2: Get Sandbox Credentials
1. Login to your sandbox dashboard at https://dev.toyyibpay.com
2. Find your `userSecretKey` at the bottom left of the main page
3. Create a category and get the `categoryCode`

### Step 3: Update Environment Variables
Update your `.env.local` file with sandbox credentials:

```env
# ToyyibPay Sandbox Configuration
TOYYIBPAY_SECRET_KEY=your_sandbox_secret_key_here
TOYYIBPAY_CATEGORY_CODE=your_sandbox_category_code_here
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 4: Test Payment
For sandbox testing, use these test banks:
- **SBI BANK A**: Success transaction
- **SBI BANK B**: Failed transaction (insufficient funds)
- **SBI BANK C**: Pending transaction (30 min delay)

Test credentials:
- Username: `1234`
- Password: `1234`

## Alternative: Use Production Environment

If you have valid production credentials and want to test with real payments:

```env
# ToyyibPay Production Configuration
TOYYIBPAY_SECRET_KEY=your_production_secret_key_here
TOYYIBPAY_CATEGORY_CODE=your_production_category_code_here
TOYYIBPAY_BASE_URL=https://toyyibpay.com

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

⚠️ **Warning**: Production environment will process real payments with real money.

## Verification Steps

After updating credentials:
1. Restart your development server: `npm run dev`
2. Test the payment flow
3. Check server logs for successful API responses
4. Verify payment completion in ToyyibPay dashboard

## Troubleshooting

If you still get `[FALSE]` response:
1. Double-check credentials are copied correctly
2. Ensure no extra spaces in environment variables
3. Verify the category code exists in your ToyyibPay account
4. Check that your account is active and verified

## Documentation References
- Official API: https://toyyibpay.com/apireference/
- Unofficial Better Docs: https://toyyibpay-api-documentation.fajarhac.com/