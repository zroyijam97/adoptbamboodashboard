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

async function testSpecificCombinations() {
  console.log('🔍 Testing specific parameter combinations...\n');
  
  const baseUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  
  // Test 1: Minimal working set
  console.log('🧪 Test 1: Minimal working parameters');
  const minimal = {
    userSecretKey: envVars.TOYYIBPAY_SECRET_KEY,
    categoryCode: envVars.TOYYIBPAY_CATEGORY_CODE,
    billName: 'Test',
    billDescription: 'Test',
    billPriceSetting: 1,
    billPayorInfo: 1,
    billAmount: 3500,
    billReturnUrl: 'http://localhost:3000/success',
    billCallbackUrl: 'http://localhost:3000/callback',
    billExternalReferenceNo: 'TEST123',
    billTo: 'Test Customer',
    billEmail: 'test@example.com',
    billPhone: '60123456789'
  };
  
  await testParams('Minimal', minimal);
  
  // Test 2: Add the problematic long parameters one by one
  console.log('\n🧪 Test 2: Add long billContentEmail');
  const withLongEmail = {
    ...minimal,
    billContentEmail: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249'
  };
  
  await testParams('With long email', withLongEmail);
  
  // Test 3: Add all the extra parameters that might be causing issues
  console.log('\n🧪 Test 3: Add all extra parameters');
  const withAllExtras = {
    ...withLongEmail,
    billSplitPayment: 0,
    billSplitPaymentArgs: '',
    billPaymentChannel: 0,
    billChargeToCustomer: 1,
    billDisplayMerchant: 1,
    billExpiryDays: 3,
    billExpiryDate: '',
    billAdditionalField: '',
    billPaymentInfo: '',
    billASPCode: ''
  };
  
  await testParams('With all extras', withAllExtras);
  
  // Test 4: Use exact app values
  console.log('\n🧪 Test 4: Exact app parameters');
  const exactApp = {
    userSecretKey: envVars.TOYYIBPAY_SECRET_KEY,
    categoryCode: envVars.TOYYIBPAY_CATEGORY_CODE,
    billName: 'Test Package - Langganan Suku ', // 30 chars exactly
    billDescription: 'Test Package - Langganan Suku Tahun',
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
  
  await testParams('Exact app', exactApp);
  
  // Test 5: Try without some optional parameters
  console.log('\n🧪 Test 5: Without optional empty parameters');
  const withoutEmpty = {
    userSecretKey: envVars.TOYYIBPAY_SECRET_KEY,
    categoryCode: envVars.TOYYIBPAY_CATEGORY_CODE,
    billName: 'Test Package - Langganan Suku ',
    billDescription: 'Test Package - Langganan Suku Tahun',
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
    billPaymentChannel: 0,
    billContentEmail: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249',
    billChargeToCustomer: 1,
    billDisplayMerchant: 1,
    billExpiryDays: 3
    // Removed empty parameters
  };
  
  await testParams('Without empty params', withoutEmpty);
}

async function testParams(testName, params) {
  const baseUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value.toString());
  });
  
  const bodyString = urlParams.toString();
  console.log(`📏 ${testName} - Body size: ${bodyString.length} chars`);
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: bodyString
    });
    
    const responseText = await response.text();
    const cleanResponse = responseText.replace(/[\t\n\r]/g, '').trim();
    
    if (cleanResponse === '[FALSE]') {
      console.log(`❌ ${testName}: [FALSE] response`);
    } else {
      try {
        const result = JSON.parse(cleanResponse);
        if (result[0]?.BillCode) {
          console.log(`✅ ${testName}: SUCCESS - ${result[0].BillCode}`);
        } else if (result.status === 'error') {
          console.log(`⚠️ ${testName}: ERROR - ${result.msg}`);
        } else {
          console.log(`❓ ${testName}: Unexpected - ${cleanResponse}`);
        }
      } catch (e) {
        console.log(`❓ ${testName}: Non-JSON - ${cleanResponse}`);
      }
    }
  } catch (error) {
    console.log(`❌ ${testName}: Request failed - ${error.message}`);
  }
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 500));
}

testSpecificCombinations();