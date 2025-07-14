// Simple ToyyibPay Credentials Test
require('dotenv').config({ path: '.env.local' });

const testCredentials = async () => {
  const userSecretKey = process.env.TOYYIBPAY_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const baseUrl = process.env.TOYYIBPAY_BASE_URL || 'https://dev.toyyibpay.com';

  console.log('🔍 Testing ToyyibPay Credentials...');
  console.log('📍 Base URL:', baseUrl);
  console.log('🔑 Secret Key:', userSecretKey ? `${userSecretKey.substring(0, 8)}...` : '❌ MISSING');
  console.log('📂 Category Code:', categoryCode || '❌ MISSING');
  console.log('');

  if (!userSecretKey || !categoryCode) {
    console.error('❌ Missing credentials! Please check your .env.local file');
    return;
  }

  try {
    const { URLSearchParams } = require('url');
    const fetch = require('node-fetch');

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

    console.log('🚀 Making test API call...');
    const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Text:', responseText);
    console.log('');

    if (responseText === '[FALSE]') {
      console.error('❌ AUTHENTICATION FAILED!');
      console.error('');
      console.error('🔍 This usually means:');
      console.error('   1. You are using production credentials with sandbox URL');
      console.error('   2. Your secret key or category code is incorrect');
      console.error('   3. Your ToyyibPay account is not active');
      console.error('');
      console.error('💡 Solutions:');
      console.error('   • For sandbox testing: Create account at https://dev.toyyibpay.com');
      console.error('   • For production: Change TOYYIBPAY_BASE_URL to https://toyyibpay.com');
      console.error('   • Verify credentials in your ToyyibPay dashboard');
      return;
    }

    try {
      const result = JSON.parse(responseText);
      if (Array.isArray(result) && result[0]?.BillCode) {
        console.log('✅ CREDENTIALS ARE WORKING!');
        console.log('🎫 Test Bill Code:', result[0].BillCode);
        console.log('🔗 Payment URL:', result[0].PaymentURL || `${baseUrl}/${result[0].BillCode}`);
        console.log('');
        console.log('🎉 Your ToyyibPay integration is ready!');
      } else {
        console.error('❌ Unexpected response format:', result);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testCredentials();