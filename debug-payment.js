const fs = require('fs');

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('🔍 Debugging Payment Parameters...\n');

// Working test parameters (from test-simple.js)
const workingParams = {
  userSecretKey: envVars.TOYYIBPAY_SECRET_KEY,
  categoryCode: envVars.TOYYIBPAY_CATEGORY_CODE,
  billName: 'Test Payment',
  billDescription: 'Test payment description',
  billPriceSetting: 1,
  billPayorInfo: 1,
  billAmount: 3500, // 35.00 in cents
  billReturnUrl: 'http://localhost:3000/payment/success',
  billCallbackUrl: 'http://localhost:3000/api/payment/callback',
  billExternalReferenceNo: 'TEST123',
  billTo: 'Test Customer',
  billEmail: 'test@example.com',
  billPhone: '60123456789',
  billSplitPayment: 0,
  billSplitPaymentArgs: '',
  billPaymentChannel: 0,
  billContentEmail: 'Thank you for your payment',
  billChargeToCustomer: 1,
  billDisplayMerchant: 1,
  billExpiryDays: 3,
  billExpiryDate: '',
  billAdditionalField: '',
  billPaymentInfo: '',
  billASPCode: ''
};

// App parameters (what should be sent)
const appParams = {
  userSecretKey: envVars.TOYYIBPAY_SECRET_KEY,
  categoryCode: envVars.TOYYIBPAY_CATEGORY_CODE,
  billName: 'Test Package - Langganan Suku T', // Truncated to 30 chars
  billDescription: 'Test Package - Langganan Suku Tahun',
  billPriceSetting: 1,
  billPayorInfo: 1,
  billAmount: 3500, // 35.00 in cents
  billReturnUrl: 'http://localhost:3000/payment/success?ref=BAMBOO1752324632052203',
  billCallbackUrl: 'http://localhost:3000/api/payment/callback',
  billExternalReferenceNo: 'BAMBOO1752324632052203',
  billTo: 'Azrul',
  billEmail: 'azrulnizamazmi.usm@gmail.com',
  billPhone: '60194667216',
  billSplitPayment: 0,
  billSplitPaymentArgs: '',
  billPaymentChannel: 0,
  billContentEmail: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324632052203',
  billChargeToCustomer: 1,
  billDisplayMerchant: 1,
  billExpiryDays: 3,
  billExpiryDate: '',
  billAdditionalField: '',
  billPaymentInfo: '',
  billASPCode: ''
};

console.log('✅ Working Test Parameters:');
Object.entries(workingParams).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\n🔧 App Parameters:');
Object.entries(appParams).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\n🔍 Differences:');
Object.keys(workingParams).forEach(key => {
  if (workingParams[key] !== appParams[key]) {
    console.log(`  ${key}:`);
    console.log(`    Working: ${workingParams[key]}`);
    console.log(`    App:     ${appParams[key]}`);
  }
});

console.log('\n📏 Parameter Lengths:');
console.log(`  billName: ${appParams.billName.length} chars (max 30)`);
console.log(`  billDescription: ${appParams.billDescription.length} chars (max 100)`);
console.log(`  billContentEmail: ${appParams.billContentEmail.length} chars`);

// Test with app parameters
async function testAppParameters() {
  console.log('\n🚀 Testing App Parameters...');
  
  const params = new URLSearchParams();
  Object.entries(appParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  try {
    const response = await fetch('https://dev.toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Response Text: ${responseText}`);

    if (responseText.trim() === '[FALSE]') {
      console.log('❌ App parameters are causing [FALSE] response');
    } else {
      console.log('✅ App parameters are working!');
    }
  } catch (error) {
    console.error('❌ Error testing app parameters:', error.message);
  }
}

testAppParameters();