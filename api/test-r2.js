/**
 * Test R2 Connection
 * Run this to verify R2 credentials and connectivity
 */

require('dotenv').config();
const r2Storage = require('./services/r2Storage');

async function testR2() {
    console.log('\n🔍 Testing Cloudflare R2 Connection...\n');

    try {
        await r2Storage.testConnection();
        console.log('\n✅ R2 is properly configured and accessible!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ R2 connection test failed!');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. Your R2 credentials in .env file');
        console.error('2. Your R2 bucket exists and is accessible');
        console.error('3. Your network connection\n');
        process.exit(1);
    }
}

testR2();
