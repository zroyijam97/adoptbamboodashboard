// ToyyibPay Credentials Test Script
// Run this to verify your ToyyibPay credentials are working

const testToyyibPayCredentials = async () => {
  const userSecretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const baseUrl = process.env.TOYYIBPAY_BASE_URL || 'https://dev.toyyibpay.com';

  console.log('Testing ToyyibPay Credentials...');
  console.log('Base URL:', baseUrl);
  console.log('Secret Key:', userSecretKey ? `${userSecretKey.substring(0, 8)}...` : 'MISSING');
  console.log('Category Code:', categoryCode || 'MISSING');

  if (!userSecretKey || !categoryCode) {
    console.error('❌ Missing credentials! Please check your .env.local file');
    return false;
  }

  try {
    // Test with minimal bill creation
    const params = new URLSearchParams();
    params.append('userSecretKey', userSecretKey);
    params.append('categoryCode', categoryCode);
    params.append('billName', 'Test Bill');
    params.append('billDescription', 'Test Description');
    params.append('billPriceSetting', '1');
    params.append('billAmount', '100'); // RM 1.00 in cents
    params.append('billPayorInfo', '1');
    params.append('billReturnUrl', 'http://localhost:3000/payment/success');
    params.append('billCallbackUrl', 'http://localhost:3000/api/payment/callback');

    const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Text:', responseText);

    if (responseText === '[FALSE]') {
      console.error('❌ Authentication Failed!');
      console.error('This usually means:');
      console.error('1. You are using production credentials with sandbox URL (or vice versa)');
      console.error('2. Your secret key or category code is incorrect');
      console.error('3. Your ToyyibPay account is not active');
      console.error('');
      console.error('Solutions:');
      console.error('- For sandbox: Create account at https://dev.toyyibpay.com');
      console.error('- For production: Use https://toyyibpay.com as base URL');
      return false;
    }

    try {
      const result = JSON.parse(responseText);
      if (Array.isArray(result) && result[0]?.BillCode) {
        console.log('✅ Credentials are working!');
        console.log('Test Bill Code:', result[0].BillCode);
        console.log('Payment URL:', result[0].PaymentURL || `${baseUrl}/${result[0].BillCode}`);
        return true;
      }
    } catch (e) {
      console.error('❌ Unexpected response format:', responseText);
      return false;
    }

  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
};

// Export for use in other files
export { testToyyibPayCredentials };

// If running directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  dotenv.config({ path: '.env.local' });
  testToyyibPayCredentials();
}