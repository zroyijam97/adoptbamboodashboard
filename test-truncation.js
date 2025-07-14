// Test truncation logic
const testString = "Test Package - Langganan Suku Tahun";
const truncated = testString.substring(0, 30);

console.log('Truncation Test:');
console.log(`Original: "${testString}" (${testString.length} chars)`);
console.log(`Truncated: "${truncated}" (${truncated.length} chars)`);
console.log(`Is 30 chars or less: ${truncated.length <= 30}`);

// Test with exact string from debug
const debugString = "Test Package - Langganan Suku T";
console.log(`\nDebug string: "${debugString}" (${debugString.length} chars)`);
console.log(`Should be 30 chars: ${debugString.length === 30}`);