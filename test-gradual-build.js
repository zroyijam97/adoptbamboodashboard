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

async function testGradualBuild() {
  console.log('🔍 Testing gradual parameter build to find breaking point...\n');
  
  const baseUrl = 'https://dev.toyyibpay.com/index.php/api/createBill';
  
  // All parameters in order
  const allParams = [
    { name: 'userSecretKey', value: envVars.TOYYIBPAY_SECRET_KEY },
    { name: 'categoryCode', value: envVars.TOYYIBPAY_CATEGORY_CODE },
    { name: 'billName', value: 'Test Package - Langganan Suku ' }, // 30 chars
    { name: 'billDescription', value: 'Test Package - Langganan Suku Tahun' },
    { name: 'billPriceSetting', value: 1 },
    { name: 'billPayorInfo', value: 1 },
    { name: 'billAmount', value: 3500 },
    { name: 'billReturnUrl', value: 'http://localhost:3000/payment/success?ref=BAMBOO1752324891736249' },
    { name: 'billCallbackUrl', value: 'http://localhost:3000/api/payment/callback' },
    { name: 'billExternalReferenceNo', value: 'BAMBOO1752324891736249' },
    { name: 'billTo', value: 'MOHAMMAD AZRUL NIZAM AZMI' },
    { name: 'billEmail', value: 'azrulnizamazmi.usm@gmail.com' },
    { name: 'billPhone', value: '60194667216' },
    { name: 'billSplitPayment', value: 0 },
    { name: 'billSplitPaymentArgs', value: '' },
    { name: 'billPaymentChannel', value: 0 },
    { name: 'billContentEmail', value: 'Terima kasih kerana menggunakan perkhidmatan kami. Rujukan: BAMBOO1752324891736249' },
    { name: 'billChargeToCustomer', value: 1 },
    { name: 'billDisplayMerchant', value: 1 },
    { name: 'billExpiryDays', value: 3 },
    { name: 'billExpiryDate', value: '' },
    { name: 'billAdditionalField', value: '' },
    { name: 'billPaymentInfo', value: '' },
    { name: 'billASPCode', value: '' }
  ];
  
  let currentParams = {};
  
  for (let i = 0; i < allParams.length; i++) {
    const param = allParams[i];
    currentParams[param.name] = param.value;
    
    console.log(`\n🧪 Testing with ${i + 1} parameters (adding: ${param.name})`);
    
    const params = new URLSearchParams();
    Object.entries(currentParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });
    
    const bodyString = params.toString();
    console.log(`📏 Request body size: ${bodyString.length} characters`);
    
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
        console.log(`❌ FAILED after adding: ${param.name}`);
        console.log(`   Parameter value: "${param.value}"`);
        console.log(`   Total body size: ${bodyString.length} chars`);
        console.log(`   Last few parameters:`);
        const lastParams = allParams.slice(Math.max(0, i - 3), i + 1);
        lastParams.forEach(p => console.log(`     ${p.name}: "${p.value}"`));
        break;
      } else {
        try {
          const result = JSON.parse(cleanResponse);
          if (result[0]?.BillCode) {
            console.log(`✅ SUCCESS: ${result[0].BillCode}`);
          } else if (result.status === 'error') {
            console.log(`❌ ERROR: ${result.msg}`);
            break;
          } else {
            console.log(`❓ Unexpected: ${cleanResponse}`);
          }
        } catch (e) {
          console.log(`❓ Non-JSON: ${cleanResponse}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
      break;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

testGradualBuild();