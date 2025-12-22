# Brevo OTP Email Integration Guide

## 📋 Overview

This guide provides a comprehensive analysis of integrating Brevo (formerly SendinBlue) for sending OTP (One-Time Password) verification emails in the TLP Platform. It covers the complete process from understanding the current implementation to full Brevo integration.

---

## 🔍 Current State Analysis

### Existing Implementation

**Current Email Service:**
- **Provider**: SendGrid (`@sendgrid/mail`)
- **Location**: `api/services/emailService.js`
- **Function**: `sendVerificationCode(to, code, username)`
- **OTP Format**: 6-digit numeric code
- **Expiration**: 10 minutes

**Current Flow:**
1. User registers → 6-digit code generated
2. Code stored in database with expiration timestamp
3. Email sent via SendGrid with HTML template
4. User enters code → verified against database
5. Email marked as verified, code cleared

**Database Schema:**
- `users.verification_code` (VARCHAR(6))
- `users.verification_code_expires_at` (TIMESTAMPTZ)
- `users.email_verified` (BOOLEAN)

---

## 📚 Brevo API Documentation Analysis

### Key Endpoints & Methods

#### 1. **Send Transactional Email**
- **Endpoint**: `POST https://api.brevo.com/v3/smtp/email`
- **Authentication**: API Key in header (`api-key: YOUR_API_KEY`)
- **Content-Type**: `application/json`

**Required Parameters:**
```json
{
  "sender": {
    "name": "Sender Name",
    "email": "sender@example.com"
  },
  "to": [
    {
      "email": "recipient@example.com",
      "name": "Recipient Name"
    }
  ],
  "subject": "Email Subject",
  "htmlContent": "<html>...</html>",
  // OR
  "textContent": "Plain text content",
  // OR
  "templateId": 123
}
```

**Response:**
```json
{
  "messageId": "<201798300811.5787683@relay.domain.com>"
}
```

#### 2. **Authentication Methods**

**API Key Authentication (Recommended for OTP):**
- Header: `api-key: xkeysib-xxxxxxxxxxxxxxxxx`
- Best for: Server-to-server communication
- Simple and secure for automated emails

**OAuth 2.0:**
- For private integrations requiring user consent
- Not needed for OTP emails

#### 3. **Rate Limits**
- **POST /v3/smtp/email**: 
  - 3,600,000 requests/hour
  - 1,000 requests/second
- More than sufficient for OTP use cases

#### 4. **SMTP Relay Option**
- Alternative: Use nodemailer with Brevo SMTP credentials
- Less recommended for API-based applications
- Better for legacy systems

---

## 🎯 Integration Options

### Option 1: Direct API Calls (Recommended)
**Pros:**
- ✅ Full control over requests
- ✅ No additional dependencies
- ✅ Better error handling
- ✅ Direct response tracking

**Cons:**
- ❌ Manual request construction
- ❌ Need to handle HTTP errors

### Option 2: Brevo Node.js SDK
**Pros:**
- ✅ Official SDK with type safety
- ✅ Simplified API calls
- ✅ Built-in error handling

**Cons:**
- ❌ Additional dependency
- ❌ SDK updates required

### Option 3: SMTP Relay (Not Recommended)
**Pros:**
- ✅ Works with existing nodemailer setup

**Cons:**
- ❌ Less reliable for transactional emails
- ❌ No direct API response tracking
- ❌ More configuration needed

---

## 🔧 Complete Implementation Process

### Step 1: Setup & Configuration

#### 1.1 Get Brevo API Key
1. Sign up at https://app.brevo.com/
2. Navigate to **Settings → API Keys**
3. Create a new API key
4. Copy the key (format: `xkeysib-xxxxxxxxxxxxxxxxx`)

#### 1.2 Register Sender Email
1. Go to **Senders & IP → Senders**
2. Add and verify your sender email
3. This email will be used in the `from` field

#### 1.3 Environment Variables
Add to `.env`:
```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=TLP Platform
APP_NAME=TLP Platform
```

### Step 2: Implementation (Direct API Approach)

#### 2.1 Update `emailService.js`

**Replace SendGrid with Brevo:**

```javascript
/**
 * Email Service
 * 
 * Handles sending emails using Brevo API
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
 */
async function sendVerificationCode(to, code, username) {
  if (!BREVO_API_KEY) {
    console.error('❌ Cannot send email: BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  // HTML email template (same as current)
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

  // Plain text fallback
  const textContent = `
    Hi ${username || 'there'},
    
    Thank you for signing up for ${APP_NAME}!
    
    Your verification code is: ${code}
    
    This code will expire in 10 minutes.
    
    If you didn't create an account, please ignore this email.
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
      console.error('❌ Brevo API Error:', responseData);
      throw new Error(`Brevo API error: ${responseData.message || response.statusText}`);
    }

    console.log(`✅ Verification email sent to ${to} (Message ID: ${responseData.messageId})`);
    return { 
      success: true, 
      messageId: responseData.messageId 
    };
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendVerificationCode,
};
```

#### 2.2 Update `package.json`

**Remove SendGrid:**
```bash
npm uninstall @sendgrid/mail
```

**No additional packages needed** (using native `fetch` in Node.js 18+)

If using Node.js < 18, install `node-fetch`:
```bash
npm install node-fetch@2
```

Then add at top of `emailService.js`:
```javascript
const fetch = require('node-fetch');
```

### Step 3: Alternative Implementation (Using Brevo SDK)

If you prefer using the official SDK:

#### 3.1 Install SDK
```bash
npm install @getbrevo/brevo
```

#### 3.2 SDK Implementation

```javascript
const brevo = require('@getbrevo/brevo');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tlp.com';
const FROM_NAME = process.env.FROM_NAME || 'TLP Platform';
const APP_NAME = process.env.APP_NAME || 'TLP Platform';

// Initialize Brevo API client
const defaultClient = brevo.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = BREVO_API_KEY;

const apiInstance = new brevo.TransactionalEmailsApi();

async function sendVerificationCode(to, code, username) {
  if (!BREVO_API_KEY) {
    console.error('❌ Cannot send email: BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  // Same HTML template as above
  const htmlContent = `...`; // (same as direct API version)
  const textContent = `...`; // (same as direct API version)

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: to, name: username || 'User' }];
  sendSmtpEmail.subject = `Verify your ${APP_NAME} account`;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.textContent = textContent;
  sendSmtpEmail.tags = ['otp', 'verification', 'email-verification'];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Verification email sent to ${to} (Message ID: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error);
    if (error.response) {
      console.error('Brevo error details:', error.response.body);
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendVerificationCode,
};
```

---

## 🔄 Complete OTP Flow

### Registration Flow

```
1. User submits registration form
   ↓
2. Backend validates input
   ↓
3. Generate 6-digit code: Math.floor(100000 + Math.random() * 900000)
   ↓
4. Store in database:
   - verification_code = "123456"
   - verification_code_expires_at = NOW() + 10 minutes
   ↓
5. Call sendVerificationCode(email, code, username)
   ↓
6. Brevo API sends email
   ↓
7. User receives email with code
   ↓
8. User enters code in verification form
   ↓
9. Backend verifies:
   - Code matches database
   - Code not expired
   - Email not already verified
   ↓
10. Mark email as verified:
    - email_verified = true
    - verification_code = NULL
    - verification_code_expires_at = NULL
   ↓
11. Generate JWT tokens and log user in
```

### Resend Verification Flow

```
1. User requests resend
   ↓
2. Check if email already verified
   ↓
3. Generate new 6-digit code
   ↓
4. Update database with new code and expiration
   ↓
5. Send new email via Brevo
   ↓
6. User receives new code
```

---

## 🧪 Testing

### Test Email Sending

```javascript
// Test script: test-brevo-email.js
require('dotenv').config();
const { sendVerificationCode } = require('./services/emailService');

async function test() {
  try {
    const result = await sendVerificationCode(
      'test@example.com',
      '123456',
      'Test User'
    );
    console.log('✅ Test email sent:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
```

Run: `node test-brevo-email.js`

### Verify in Brevo Dashboard

1. Go to **Transactional → Email Logs**
2. Check for sent emails
3. Verify delivery status
4. Check for any bounces or errors

---

## 🛡️ Error Handling

### Common Errors

**1. Invalid API Key**
```json
{
  "code": "unauthorized",
  "message": "Invalid API key"
}
```
**Solution**: Verify `BREVO_API_KEY` in `.env`

**2. Unverified Sender**
```json
{
  "code": "invalid_parameter",
  "message": "Sender email not verified"
}
```
**Solution**: Verify sender email in Brevo dashboard

**3. Rate Limit Exceeded**
```json
{
  "code": "rate_limit_exceeded",
  "message": "Too many requests"
}
```
**Solution**: Implement retry logic with exponential backoff

### Enhanced Error Handling

```javascript
async function sendVerificationCode(to, code, username) {
  // ... (previous code)
  
  try {
    const response = await fetch(BREVO_API_URL, {
      // ... (request config)
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Invalid Brevo API key');
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${responseData.message}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Brevo API error: ${responseData.message || response.statusText}`);
      }
    }

    return { success: true, messageId: responseData.messageId };
  } catch (error) {
    // Log error for monitoring
    console.error('❌ Brevo email error:', {
      to,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw for upstream handling
    throw error;
  }
}
```

---

## 📊 Monitoring & Logging

### Track Email Status

Brevo provides webhooks for email events:
- `sent` - Email was sent
- `delivered` - Email was delivered
- `opened` - Email was opened
- `clicked` - Link was clicked
- `bounce` - Email bounced
- `blocked` - Email was blocked

**Setup Webhook:**
1. Go to **Transactional → Webhooks**
2. Add webhook URL: `https://your-api.com/webhooks/brevo`
3. Select events: `sent`, `delivered`, `bounce`, `blocked`

**Webhook Payload Example:**
```json
{
  "event": "delivered",
  "email": "user@example.com",
  "id": 26224,
  "date": "2024-01-15 10:30:00",
  "message-id": "<201798300811.5787683@relay.domain.com>",
  "subject": "Verify your TLP Platform account",
  "tag": "[\"otp\", \"verification\"]"
}
```

---

## 🔐 Security Best Practices

1. **API Key Security**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys periodically
   - Use different keys for dev/prod

2. **Rate Limiting**
   - Implement rate limiting on resend endpoint
   - Prevent abuse: max 3 resends per hour per email

3. **Code Security**
   - 6-digit codes are sufficient
   - 10-minute expiration is appropriate
   - Clear codes after verification
   - Log failed verification attempts

4. **Email Security**
   - Use HTTPS for all API calls
   - Validate email addresses
   - Sanitize user input in templates

---

## 📝 Migration Checklist

- [ ] Create Brevo account
- [ ] Generate API key
- [ ] Verify sender email/domain
- [ ] Update `.env` with `BREVO_API_KEY`
- [ ] Update `emailService.js` (choose direct API or SDK)
- [ ] Remove `@sendgrid/mail` dependency
- [ ] Test email sending
- [ ] Verify email delivery
- [ ] Update error handling
- [ ] Set up webhooks (optional)
- [ ] Monitor email logs
- [ ] Update documentation

---

## 🚀 Deployment

### Environment Variables

**Production `.env`:**
```env
BREVO_API_KEY=xkeysib-prod-xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=TLP Platform
APP_NAME=TLP Platform
NODE_ENV=production
```

### Testing in Production

1. Send test email to your own address
2. Verify email arrives
3. Check Brevo dashboard for delivery status
4. Test OTP verification flow end-to-end

---

## 📚 Additional Resources

- **Brevo API Reference**: https://developers.brevo.com/reference/sendtransacemail
- **Brevo Node.js SDK**: https://github.com/getbrevo/brevo-node
- **Brevo Dashboard**: https://app.brevo.com/
- **Rate Limits**: https://developers.brevo.com/docs/api-limits
- **Webhooks Guide**: https://developers.brevo.com/docs/transactional-webhooks

---

## ✅ Summary

**Recommended Approach:**
- Use **Direct API calls** (Option 1) for simplicity and control
- Keep existing OTP flow and database schema
- Maintain same email template design
- Add proper error handling and logging
- Set up webhooks for delivery tracking

**Key Benefits:**
- ✅ Reliable email delivery
- ✅ High rate limits (sufficient for OTP)
- ✅ Simple API integration
- ✅ Good documentation
- ✅ Free tier available (300 emails/day)

**Next Steps:**
1. Review this guide
2. Choose implementation approach (Direct API recommended)
3. Follow Step 2 implementation
4. Test thoroughly
5. Deploy to production

