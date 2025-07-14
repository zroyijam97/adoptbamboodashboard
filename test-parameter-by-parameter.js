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

async function testParameterByParameter() {
  console.log('🔍 Testing parameters one by one to find the culprit...\n');
  
  const baseUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  
  // Start with working minimal parameters
  const baseParams = {
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
  
  // Parameters to test one by one
  const testParams = [
    { name: 'billName', value: 'Test Package - Langganan Suku ' }, // 30 chars
    { name: 'billDescription', value: 'Test Package - Langganan Suku Tahun' },
    { name: 'billReturnUrl', value: 'http://localhost:3000/payment/success?ref=BAMBOO1752324891736249' },
    { name: 'billExternalReferenceNo', value: 'BAMBOO1752324891736249' },
    { name: 'billTo', value: 'MOHAMMAD AZRUL NIZAM AZMI' },
    { name: 'billEmail', value: 'azrulnizamazmi.usm@gmail.com' },
    { name: 'billPhone', value: '60194667216' },
    { name: 'billContentEmail', value: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249' },
    { name: 'billSplitPayment', value: 0 },
    { name: 'billSplitPaymentArgs', value: '' },
    { name: 'billPaymentChannel', value: 0 },
    { name: 'billChargeToCustomer', value: 1 },
    { name: 'billDisplayMerchant', value: 1 },
    { name: 'billExpiryDays', value: 3 },
    { name: 'billExpiryDate', value: '' },
    { name: 'billAdditionalField', value: '' },
    { name: 'billPaymentInfo', value: '' },
    { name: 'billASPCode', value: '' }
  ];
  
  for (const testParam of testParams) {
    console.log(`\n🧪 Testing parameter: ${testParam.name} = "${testParam.value}"`);
    
    const params = new URLSearchParams();
    const currentParams = { ...baseParams, [testParam.name]: testParam.value };
    
    Object.entries(currentParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });
      
      const responseText = await response.text();
      const cleanResponse = responseText.replace(/[\t\n\r]/g, '').trim();
      
      if (cleanResponse === '[FALSE]') {
        console.log(`❌ FAILED with ${testParam.name}: ${testParam.value}`);
        console.log(`   Length: ${testParam.value.toString().length} chars`);
        break; // Stop at first failure
      } else {
        try {
          const result = JSON.parse(cleanResponse);
          if (result[0]?.BillCode) {
            console.log(`✅ SUCCESS with ${testParam.name}: ${result[0].BillCode}`);
          } else {
            console.log(`❓ Unexpected response: ${cleanResponse}`);
          }
        } catch (e) {
          console.log(`❓ Non-JSON response: ${cleanResponse}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testParameterByParameter();