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

console.log('🔍 Testing Exact App Parameters...\n');

// Simulate exact app flow
const description = 'Test Package - Langganan Suku Tahun';
const truncatedBillName = (description || 'Payment').substring(0, 30);

console.log('Bill name processing:', {
  original: description,
  originalLength: description?.length,
  truncated: truncatedBillName,
  truncatedLength: truncatedBillName.length
});

// Exact parameters as they would be sent by the app
const params = new URLSearchParams();

// Add userSecretKey and categoryCode first
params.append('userSecretKey', envVars.TOYYIBPAY_SECRET_KEY);
params.append('categoryCode', envVars.TOYYIBPAY_CATEGORY_CODE);

// Add all other parameters exactly as the app does
const requestParams = {
  billName: truncatedBillName,
  billDescription: description,
  billPriceSetting: 1,
  billPayorInfo: 1,
  billAmount: 3500,
  billReturnUrl: 'http://localhost:3000/payment/success?ref=BAMBOO1752324891736249',
  billCallbackUrl: 'http://localhost:3000/api/payment/callback',
  billExternalReferenceNo: 'BAMBOO1752324891736249',
  billTo: 'MOHAMMAD AZRUL NIZAM AZMI',
  billEmail: 'azrulnizamazmi.usm@gmail.com',
  billPhone: '60194667216',
  billSplitPayment: 0,
  billSplitPaymentArgs: '',
  billPaymentChannel: 0,
  billContentEmail: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249',
  billChargeToCustomer: 1,
  billDisplayMerchant: 1,
  billExpiryDays: 3,
  billExpiryDate: '',
  billAdditionalField: '',
  billPaymentInfo: '',
  billASPCode: ''
};

console.log('\n📋 Request Parameters:');
Object.entries(requestParams).forEach(([key, value]) => {
  console.log(`  ${key}: ${value} (${typeof value})`);
  params.append(key, value.toString());
});

console.log(`\n🔑 Secret Key: ${envVars.TOYYIBPAY_SECRET_KEY?.substring(0, 8)}...`);
console.log(`📂 Category Code: ${envVars.TOYYIBPAY_CATEGORY_CODE}`);

async function testExactAppFlow() {
  console.log('\n🚀 Testing with exact app parameters...');
  
  const requestUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  console.log(`📍 Request URL: ${requestUrl}`);
  console.log(`📦 Request Body: ${params.toString()}`);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📄 Response Text: ${responseText}`);

    // Clean the response text
    const cleanResponse = responseText.replace(/[\t\n\r]/g, '').trim();
    console.log(`🧹 Cleaned Response: ${cleanResponse}`);

    if (cleanResponse === '[FALSE]') {
      console.log('❌ Getting [FALSE] response - authentication or parameter issue');
      
      // Test with minimal working parameters
      console.log('\n🔧 Testing with minimal parameters...');
      const minimalParams = new URLSearchParams();
      minimalParams.append('userSecretKey', envVars.TOYYIBPAY_SECRET_KEY);
      minimalParams.append('categoryCode', envVars.TOYYIBPAY_CATEGORY_CODE);
      minimalParams.append('billName', 'Test');
      minimalParams.append('billDescription', 'Test');
      minimalParams.append('billPriceSetting', '1');
      minimalParams.append('billPayorInfo', '1');
      minimalParams.append('billAmount', '3500');
      minimalParams.append('billReturnUrl', 'http://localhost:3000/success');
      minimalParams.append('billCallbackUrl', 'http://localhost:3000/callback');
      minimalParams.append('billExternalReferenceNo', 'TEST123');
      minimalParams.append('billTo', 'Test Customer');
      minimalParams.append('billEmail', 'test@example.com');
      minimalParams.append('billPhone', '60123456789');
      
      const minimalResponse = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: minimalParams.toString()
      });
      
      const minimalResponseText = await minimalResponse.text();
      console.log(`📊 Minimal Response Status: ${minimalResponse.status}`);
      console.log(`📄 Minimal Response Text: ${minimalResponseText}`);
      
    } else {
      try {
        const result = JSON.parse(cleanResponse);
        if (result.status === 'error') {
          console.log(`❌ Error: ${result.msg}`);
        } else if (Array.isArray(result) && result[0]?.BillCode) {
          console.log(`✅ Success! Bill Code: ${result[0].BillCode}`);
        } else {
          console.log(`❓ Unexpected response: ${JSON.stringify(result)}`);
        }
      } catch (e) {
        console.log(`❌ Failed to parse response: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testExactAppFlow();