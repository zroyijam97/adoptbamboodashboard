// Simple ToyyibPay Credentials Test (Node.js 18+)
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

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
    const params = new URLSearchParams();
    params.append('userSecretKey', userSecretKey);
    params.append('categoryCode', categoryCode);
    params.append('billName', 'Test Bill');
    params.append('billDescription', 'Test Description');
    params.append('billPriceSetting', '1');
    params.append('billAmount', '100'); // RM 1.00 in cents
    params.append('billPayorInfo', '1');
    params.append('billTo', 'Test Customer'); // Required field
    params.append('billEmail', 'test@example.com'); // Required field
    params.append('billPhone', '0123456789'); // Required field
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
      console.error('🔍 This confirms the issue:');
      console.error('   • You are using production credentials with sandbox URL');
      console.error('   • OR your credentials are incorrect');
      console.error('');
      console.error('💡 Next Steps:');
      console.error('   1. Go to https://dev.toyyibpay.com');
      console.error('   2. Create a new sandbox account');
      console.error('   3. Get sandbox credentials from the dashboard');
      console.error('   4. Update your .env.local file with sandbox credentials');
      console.error('');
      console.error('📖 See TOYYIBPAY_SETUP_GUIDE.md for detailed instructions');
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