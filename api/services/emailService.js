/**
 * Email Service
 * 
 * Handles sending emails using Brevo API (Direct API approach)
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tlp.com';
const FROM_NAME = process.env.FROM_NAME || 'TLP Platform';
const APP_NAME = process.env.APP_NAME || 'TLP Platform';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Validate configuration
if (!BREVO_API_KEY) {
  console.warn('⚠️  BREVO_API_KEY not set. Email service will not work.');
}

/**
 * Send verification code email via Brevo API
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} username - User's username
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
async function sendVerificationCode(to, code, username) {
  if (!BREVO_API_KEY) {
    console.error('❌ Cannot send email: BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  // HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p>Hi ${username || 'there'},</p>
        <p>Thank you for signing up for ${APP_NAME}! Please use the verification code below to verify your email address:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Plain text fallback for email clients that don't support HTML
  const textContent = `
    Hi ${username || 'there'},
    
    Thank you for signing up for ${APP_NAME}!
    
    Your verification code is: ${code}
    
    This code will expire in 10 minutes.
    
    If you didn't create an account, please ignore this email.
    
    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `;

  // Brevo API request payload
  const payload = {
    sender: {
      name: FROM_NAME,
      email: FROM_EMAIL
    },
    to: [
      {
        email: to,
        name: username || 'User'
      }
    ],
    subject: `Verify your ${APP_NAME} account`,
    htmlContent: htmlContent,
    textContent: textContent,
    tags: ['otp', 'verification', 'email-verification']
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        console.error('❌ Brevo API Error:', responseData);
        
        // Check for IP authorization error
        if (responseData.message && responseData.message.includes('unrecognised IP address')) {
          const ipMatch = responseData.message.match(/\d+\.\d+\.\d+\.\d+/);
          const ipAddress = ipMatch ? ipMatch[0] : 'your IP';
          throw new Error(
            `IP address not authorized. Brevo detected an unrecognised IP address (${ipAddress}). ` +
            `Please add this IP to authorized IPs in Brevo: https://app.brevo.com/security/authorised_ips ` +
            `Or disable IP restrictions in your Brevo account settings.`
          );
        }
        
        throw new Error('Invalid Brevo API key. Please check your BREVO_API_KEY environment variable.');
      } else if (response.status === 400) {
        console.error('❌ Brevo API Error:', responseData);
        
        // Check for sender verification error
        if (responseData.message && (responseData.message.includes('sender') || responseData.message.includes('Sender'))) {
          throw new Error(
            `Sender email not verified. Please verify your sender email (${FROM_EMAIL}) in Brevo: ` +
            `https://app.brevo.com/settings/senders`
          );
        }
        
        throw new Error(`Invalid request: ${responseData.message || 'Bad request'}`);
      } else if (response.status === 429) {
        console.error('❌ Brevo API Error: Rate limit exceeded');
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        console.error('❌ Brevo API Error:', responseData);
        throw new Error(`Brevo API error: ${responseData.message || response.statusText}`);
      }
    }

    console.log(`✅ Verification email sent to ${to} (Message ID: ${responseData.messageId})`);
    return { 
      success: true, 
      messageId: responseData.messageId 
    };
  } catch (error) {
    // Handle network errors or other exceptions
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Network error: Failed to connect to Brevo API');
      throw new Error('Network error: Unable to connect to email service');
    }
    
    // Re-throw if it's already a formatted error
    if (error.message && error.message.includes('Brevo') || error.message.includes('Invalid') || error.message.includes('Rate limit')) {
      throw error;
    }
    
    // Log and throw generic error for unexpected cases
    console.error('❌ Error sending email via Brevo:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendVerificationCode,
};
