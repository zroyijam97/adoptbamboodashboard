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

async function testFixedParameters() {
  console.log('🔍 Testing fixed parameter logic (excluding empty parameters)...\n');
  
  const baseUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  
  // Simulate the fixed logic - only include non-empty parameters
  const requestParams = {
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
    billPaymentChannel: 0,
    billContentEmail: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249',
    billChargeToCustomer: 1,
    billDisplayMerchant: 1,
    billExpiryDays: 3
    // Note: Excluded empty parameters like billSplitPaymentArgs, billExpiryDate, etc.
  };
  
  const urlParams = new URLSearchParams();
  
  // Only add non-empty parameters
  Object.entries(requestParams).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      urlParams.append(key, value.toString());
    }
  });
  
  const bodyString = urlParams.toString();
  console.log(`📏 Request body size: ${bodyString.length} characters`);
  console.log(`📋 Parameters included: ${Object.keys(requestParams).length}`);
  
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
      console.log('❌ Still getting [FALSE] response');
    } else {
      try {
        const result = JSON.parse(cleanResponse);
        if (result[0]?.BillCode) {
          console.log(`✅ SUCCESS! Bill created: ${result[0].BillCode}`);
          console.log(`🔗 Payment URL: ${result[0].PaymentURL || 'https://dev.toyyibpay.com/' + result[0].BillCode}`);
        } else if (result.status === 'error') {
          console.log(`⚠️ API Error: ${result.msg}`);
        } else {
          console.log(`❓ Unexpected response: ${cleanResponse}`);
        }
      } catch (e) {
        console.log(`❓ Non-JSON response: ${cleanResponse}`);
      }
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testFixedParameters();