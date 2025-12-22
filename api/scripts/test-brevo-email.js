/**
 * Test Script for Brevo Email Integration
 * 
 * This script tests the Brevo email service by sending a test verification email.
 * 
 * Usage:
 *   node scripts/test-brevo-email.js <recipient-email> [username]
 * 
 * Example:
 *   node scripts/test-brevo-email.js test@example.com "Test User"
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sendVerificationCode } = require('../services/emailService');

async function testBrevoEmail() {
  // Get recipient email from command line arguments
  const recipientEmail = process.argv[2];
  const username = process.argv[3] || 'Test User';
  
  if (!recipientEmail) {
    console.error('❌ Error: Recipient email is required');
    console.log('\nUsage: node scripts/test-brevo-email.js <recipient-email> [username]');
    console.log('Example: node scripts/test-brevo-email.js test@example.com "Test User"');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Check if BREVO_API_KEY is set
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ Error: BREVO_API_KEY environment variable is not set');
    console.log('\nPlease set BREVO_API_KEY in your .env file:');
    console.log('BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxx');
    process.exit(1);
  }

  // Generate a test verification code
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('🧪 Testing Brevo Email Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Recipient: ${recipientEmail}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔢 Verification Code: ${testCode}`);
  console.log(`🔑 API Key: ${process.env.BREVO_API_KEY.substring(0, 15)}...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('📤 Sending test email...\n');
    
    const result = await sendVerificationCode(recipientEmail, testCode, username);
    
    console.log('✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Email sent successfully!`);
    console.log(`📨 Message ID: ${result.messageId}`);
    console.log(`📧 Check inbox: ${recipientEmail}`);
    console.log(`🔢 Test Code: ${testCode}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Next steps:');
    console.log('   1. Check your email inbox (and spam folder)');
    console.log('   2. Verify the email was delivered');
    console.log('   3. Check Brevo dashboard for delivery status');
    console.log('   4. If successful, the integration is working! 🎉\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ Error: ${error.message}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Provide helpful error messages
    if (error.message.includes('Invalid API key')) {
      console.error('💡 Troubleshooting:');
      console.error('   - Verify your BREVO_API_KEY is correct');
      console.error('   - Get your API key from: https://app.brevo.com/settings/keys/api');
      console.error('   - Make sure the key starts with "xkeysib-"\n');
    } else if (error.message.includes('sender') || error.message.includes('Sender')) {
      console.error('💡 Troubleshooting:');
      console.error('   - Verify your sender email is registered in Brevo');
      console.error('   - Go to: https://app.brevo.com/settings/senders');
      console.error('   - Add and verify your sender email address\n');
    } else if (error.message.includes('Rate limit')) {
      console.error('💡 Troubleshooting:');
      console.error('   - You have exceeded the rate limit');
      console.error('   - Wait a few minutes and try again');
      console.error('   - Check your Brevo plan limits\n');
    } else {
      console.error('💡 Troubleshooting:');
      console.error('   - Check your internet connection');
      console.error('   - Verify Brevo API is accessible');
      console.error('   - Check Brevo status: https://status.brevo.com/\n');
    }
    
    process.exit(1);
  }
}

// Run the test
testBrevoEmail();

