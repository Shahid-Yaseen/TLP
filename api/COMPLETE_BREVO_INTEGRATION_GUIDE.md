# Complete Brevo Integration Guide
## Replacing SendGrid with Brevo in Node.js Projects

This is a comprehensive, step-by-step guide for migrating from SendGrid to Brevo (formerly SendinBlue) in any Node.js project. Follow this guide to replace SendGrid email functionality with Brevo's API.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Brevo Account Setup](#step-1-brevo-account-setup)
4. [Step 2: Get API Credentials](#step-2-get-api-credentials)
5. [Step 3: Verify Sender Email](#step-3-verify-sender-email)
6. [Step 4: Update Environment Variables](#step-4-update-environment-variables)
7. [Step 5: Remove SendGrid Dependencies](#step-5-remove-sendgrid-dependencies)
8. [Step 6: Implement Brevo Email Service](#step-6-implement-brevo-email-service)
9. [Step 7: Update Your Code](#step-7-update-your-code)
10. [Step 8: Test the Integration](#step-8-test-the-integration)
11. [Step 9: IP Authorization Setup](#step-9-ip-authorization-setup)
12. [Troubleshooting](#troubleshooting)
13. [Migration Checklist](#migration-checklist)
14. [Code Examples](#code-examples)

---

## Overview

### What is Brevo?

Brevo (formerly SendinBlue) is an email service provider that offers:
- **Transactional Email API** - Send emails programmatically
- **Free Tier** - 300 emails/day
- **High Rate Limits** - 3,600,000 requests/hour
- **Simple API** - RESTful API with straightforward integration
- **Good Deliverability** - High email delivery rates

### Why Replace SendGrid with Brevo?

- ✅ **Cost-effective** - Generous free tier
- ✅ **Simple Integration** - Direct API calls, no complex SDK needed
- ✅ **Good Documentation** - Clear API documentation
- ✅ **Reliable** - High deliverability rates
- ✅ **Flexible** - Multiple integration options

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ (for native `fetch` support) or Node.js 16+ with `node-fetch`
- ✅ An existing project using SendGrid
- ✅ Access to your project's environment variables
- ✅ Basic understanding of Node.js and REST APIs

---

## Step 1: Brevo Account Setup

### 1.1 Create Brevo Account

1. Go to **https://app.brevo.com/**
2. Click **"Sign Up"** or **"Create Account"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (optional)
4. Verify your email address (check inbox)
5. Complete the account setup

### 1.2 Choose Your Plan

- **Free Plan**: 300 emails/day (perfect for testing and small projects)
- **Lite Plan**: 10,000 emails/month (paid)
- **Premium Plans**: Higher limits (paid)

For most projects, the free tier is sufficient to start.

---

## Step 2: Get API Credentials

### 2.1 Generate API Key

1. Log in to **Brevo Dashboard**: https://app.brevo.com/
2. Navigate to **Settings → API Keys**: https://app.brevo.com/settings/keys/api
3. Click **"Generate a new API key"**
4. Enter a name for your API key (e.g., "Production API Key" or "Development API Key")
5. Select permissions:
   - ✅ **Send emails** (required)
   - ✅ **Read emails** (optional, for logs)
6. Click **"Generate"**
7. **Copy the API key immediately** - it won't be shown again!

**API Key Format:** `xkeysib-xxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxx`

### 2.2 Store API Key Securely

- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically

---

## Step 3: Verify Sender Email

**⚠️ CRITICAL STEP - Emails won't send without this!**

### 3.1 Register Sender Email

1. Go to **Senders & IP → Senders**: https://app.brevo.com/settings/senders
2. Click **"Add a new sender"**
3. Fill in the form:
   - **Email**: Your sender email (e.g., `noreply@yourdomain.com`)
   - **Name**: Display name (e.g., "Your App Name")
   - **Company**: Your company name (optional)
4. Click **"Save"**

### 3.2 Verify Sender Email

1. Check your email inbox for verification email from Brevo
2. Click the verification link in the email
3. Or manually verify:
   - Go back to **Senders** page
   - Find your sender email
   - Click **"Verify"** if not yet verified
   - Follow the verification steps

**Note:** Without verification, all email sends will fail with a "sender not verified" error.

---

## Step 4: Update Environment Variables

### 4.1 Identify Your Current SendGrid Variables

Check your `.env` file for SendGrid variables:

```env
# Current SendGrid variables (to be replaced)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

### 4.2 Add Brevo Variables

Update your `.env` file:

```env
# Brevo Configuration (replace SendGrid)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your App Name
APP_NAME=Your App Name

# Optional: Keep old SendGrid vars commented for reference
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### 4.3 Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BREVO_API_KEY` | ✅ Yes | Your Brevo API key | `xkeysib-abc123...` |
| `FROM_EMAIL` | ✅ Yes | Verified sender email | `noreply@yourdomain.com` |
| `FROM_NAME` | ⚠️ Recommended | Display name for emails | `Your App Name` |
| `APP_NAME` | ⚠️ Recommended | App name for email templates | `Your App Name` |

---

## Step 5: Remove SendGrid Dependencies

### 5.1 Uninstall SendGrid Package

```bash
npm uninstall @sendgrid/mail
```

Or if using yarn:

```bash
yarn remove @sendgrid/mail
```

### 5.2 Verify Removal

Check your `package.json` to ensure `@sendgrid/mail` is removed:

```bash
cat package.json | grep sendgrid
```

Should return nothing if successfully removed.

---

## Step 6: Implement Brevo Email Service

### 6.1 Create/Update Email Service File

Create or update your email service file (e.g., `services/emailService.js`, `utils/email.js`, etc.)

### 6.2 Implementation Options

You have two options:

#### Option A: Direct API Calls (Recommended)

**Pros:**
- ✅ No additional dependencies
- ✅ Full control
- ✅ Works with Node.js 18+ native `fetch`
- ✅ Smaller bundle size

**Cons:**
- ❌ Manual request construction
- ❌ Need to handle HTTP errors

#### Option B: Brevo Node.js SDK

**Pros:**
- ✅ Official SDK
- ✅ Type safety (if using TypeScript)
- ✅ Built-in error handling

**Cons:**
- ❌ Additional dependency
- ❌ Larger bundle size

**We'll use Option A (Direct API) as it's simpler and doesn't require extra dependencies.**

---

## Step 7: Update Your Code

### 7.1 Complete Email Service Implementation

Replace your SendGrid email service with this Brevo implementation:

```javascript
/**
 * Email Service
 * 
 * Handles sending emails using Brevo API (Direct API approach)
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'Your App Name';
const APP_NAME = process.env.APP_NAME || 'Your App Name';
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

  // Plain text fallback
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
    if (error.message && (error.message.includes('Brevo') || error.message.includes('Invalid') || error.message.includes('Rate limit') || error.message.includes('IP address') || error.message.includes('Sender'))) {
      throw error;
    }
    
    // Log and throw generic error for unexpected cases
    console.error('❌ Error sending email via Brevo:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link
 * @param {string} username - User's username
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
async function sendPasswordResetEmail(to, resetLink, username) {
  if (!BREVO_API_KEY) {
    console.error('❌ Cannot send email: BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>Hi ${username || 'there'},</p>
        <p>You requested to reset your password for ${APP_NAME}. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetLink}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Hi ${username || 'there'},
    
    You requested to reset your password for ${APP_NAME}.
    
    Click this link to reset your password: ${resetLink}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
  `;

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
    subject: `Reset your ${APP_NAME} password`,
    htmlContent: htmlContent,
    textContent: textContent,
    tags: ['password-reset']
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
      if (response.status === 401) {
        throw new Error('Invalid Brevo API key');
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${responseData.message || 'Bad request'}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Brevo API error: ${responseData.message || response.statusText}`);
      }
    }

    console.log(`✅ Password reset email sent to ${to} (Message ID: ${responseData.messageId})`);
    return { 
      success: true, 
      messageId: responseData.messageId 
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Generic email sending function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - HTML content
 * @param {string} options.textContent - Plain text content (optional)
 * @param {string} options.toName - Recipient name (optional)
 * @param {Array<string>} options.tags - Email tags (optional)
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
async function sendEmail({ to, subject, htmlContent, textContent, toName, tags = [] }) {
  if (!BREVO_API_KEY) {
    throw new Error('Email service not configured');
  }

  const payload = {
    sender: {
      name: FROM_NAME,
      email: FROM_EMAIL
    },
    to: [
      {
        email: to,
        name: toName || 'User'
      }
    ],
    subject: subject,
    htmlContent: htmlContent,
    ...(textContent && { textContent: textContent }),
    ...(tags.length > 0 && { tags: tags })
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
      if (response.status === 401) {
        throw new Error('Invalid Brevo API key');
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${responseData.message || 'Bad request'}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`Brevo API error: ${responseData.message || response.statusText}`);
      }
    }

    return { 
      success: true, 
      messageId: responseData.messageId 
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationCode,
  sendPasswordResetEmail,
  sendEmail,
};
```

### 7.2 For Node.js < 18 (Using node-fetch)

If you're using Node.js 16 or earlier, install `node-fetch`:

```bash
npm install node-fetch@2
```

Then add at the top of your email service file:

```javascript
const fetch = require('node-fetch');
```

### 7.3 Update Your Routes/Controllers

Your existing code should work with minimal changes. The function signatures are similar:

**Before (SendGrid):**
```javascript
const { sendVerificationCode } = require('./services/emailService');
await sendVerificationCode(email, code, username);
```

**After (Brevo):**
```javascript
const { sendVerificationCode } = require('./services/emailService');
await sendVerificationCode(email, code, username);
```

**No changes needed!** The function signature is the same.

---

## Step 8: Test the Integration

### 8.1 Create Test Script

Create a test script `scripts/test-brevo-email.js`:

```javascript
/**
 * Test Script for Brevo Email Integration
 */

require('dotenv').config();
const { sendVerificationCode } = require('../services/emailService');

async function test() {
  const recipientEmail = process.argv[2] || process.env.FROM_EMAIL;
  const username = process.argv[3] || 'Test User';
  
  if (!recipientEmail) {
    console.error('❌ Error: Recipient email is required');
    console.log('\nUsage: node scripts/test-brevo-email.js <email> [username]');
    process.exit(1);
  }

  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('🧪 Testing Brevo Email Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Recipient: ${recipientEmail}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔢 Verification Code: ${testCode}`);
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
    
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ Error: ${error.message}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

test();
```

### 8.2 Run the Test

```bash
node scripts/test-brevo-email.js your-email@example.com "Test User"
```

### 8.3 Expected Output

```
🧪 Testing Brevo Email Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Recipient: your-email@example.com
👤 Username: Test User
🔢 Verification Code: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 Sending test email...

✅ SUCCESS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Email sent successfully!
📨 Message ID: <202512192127.17098287054@smtp-relay.mailin.fr>
📧 Check inbox: your-email@example.com
🔢 Test Code: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 9: IP Authorization Setup

### 9.1 The Issue

Brevo may block API requests from unrecognized IP addresses for security. You'll see an error like:

```
We have detected you are using an unrecognised IP address [YOUR_IP]. 
Please add this IP to authorized IPs: https://app.brevo.com/security/authorised_ips
```

### 9.2 Solution Options

#### Option A: Add IP to Authorized List (Recommended)

1. Go to: **https://app.brevo.com/security/authorised_ips**
2. Click **"Add an IP address"**
3. Enter your server's IP address
4. Click **"Add"**

**For Dynamic IPs:** Add multiple IPs or use Option B.

#### Option B: Disable IP Restrictions

1. Go to: **https://app.brevo.com/security/authorised_ips**
2. Find **"IP Restrictions"** settings
3. Disable IP restrictions (allow all IPs)
4. Save changes

**⚠️ Warning:** Less secure but convenient for development.

### 9.3 Find Your IP Address

```bash
# On Linux/Mac
curl ifconfig.me

# Or
curl ipinfo.io/ip
```

---

## Troubleshooting

### Error: "Invalid API key"

**Solution:**
1. Verify `BREVO_API_KEY` is set in `.env`
2. Check the key format starts with `xkeysib-`
3. Get a new API key from: https://app.brevo.com/settings/keys/api
4. Make sure there are no extra spaces or quotes in `.env`

### Error: "Sender email not verified"

**Solution:**
1. Go to: https://app.brevo.com/settings/senders
2. Add your sender email if not added
3. Verify the email (check inbox for verification email)
4. Make sure `FROM_EMAIL` in `.env` matches the verified email

### Error: "IP address not authorized"

**Solution:**
1. Go to: https://app.brevo.com/security/authorised_ips
2. Add your IP address to authorized list
3. Or disable IP restrictions

### Error: "Rate limit exceeded"

**Solution:**
1. Free tier: 300 emails/day
2. Wait a few minutes and try again
3. Check your Brevo plan limits
4. Consider upgrading if needed

### Email Not Received

**Check:**
1. ✅ Spam/junk folder
2. ✅ Sender email is verified in Brevo
3. ✅ Brevo dashboard → Email Logs for delivery status
4. ✅ Recipient email address is correct
5. ✅ Check Brevo dashboard for bounces or blocks

### Network Error: "Failed to connect"

**Solution:**
1. Check internet connection
2. Verify Brevo API is accessible: https://status.brevo.com/
3. Check firewall settings
4. Try again after a few minutes

---

## Migration Checklist

Use this checklist to ensure a complete migration:

### Pre-Migration
- [ ] Brevo account created
- [ ] API key generated and copied
- [ ] Sender email registered in Brevo
- [ ] Sender email verified
- [ ] Environment variables documented

### Migration
- [ ] `.env` file updated with Brevo credentials
- [ ] SendGrid package removed (`npm uninstall @sendgrid/mail`)
- [ ] Email service file updated with Brevo code
- [ ] Code reviewed for any SendGrid-specific logic
- [ ] All email functions updated

### Testing
- [ ] Test script created
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] IP address authorized (if needed)
- [ ] Full registration flow tested
- [ ] Password reset flow tested (if applicable)

### Post-Migration
- [ ] Brevo dashboard checked for email logs
- [ ] Error handling verified
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Team notified of changes

---

## Code Examples

### Example 1: Basic Email Sending

```javascript
const { sendEmail } = require('./services/emailService');

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  htmlContent: '<h1>Welcome to our app!</h1>',
  textContent: 'Welcome to our app!',
  toName: 'John Doe',
  tags: ['welcome']
});
```

### Example 2: OTP Verification

```javascript
const { sendVerificationCode } = require('./services/emailService');

const code = Math.floor(100000 + Math.random() * 900000).toString();
await sendVerificationCode('user@example.com', code, 'John Doe');
```

### Example 3: Password Reset

```javascript
const { sendPasswordResetEmail } = require('./services/emailService');

const resetLink = `https://yourapp.com/reset-password?token=${token}`;
await sendPasswordResetEmail('user@example.com', resetLink, 'John Doe');
```

### Example 4: Error Handling

```javascript
try {
  await sendVerificationCode(email, code, username);
  console.log('Email sent successfully');
} catch (error) {
  if (error.message.includes('IP address not authorized')) {
    // Handle IP authorization error
    console.error('Please authorize your IP in Brevo');
  } else if (error.message.includes('Sender email not verified')) {
    // Handle sender verification error
    console.error('Please verify sender email in Brevo');
  } else {
    // Handle other errors
    console.error('Failed to send email:', error.message);
  }
}
```

---

## Additional Resources

### Brevo Documentation
- **API Reference**: https://developers.brevo.com/reference/sendtransacemail
- **Send Transactional Email**: https://developers.brevo.com/docs/send-a-transactional-email
- **Authentication**: https://developers.brevo.com/docs/authentication-schemes
- **Rate Limits**: https://developers.brevo.com/docs/api-limits

### Brevo Dashboard Links
- **Dashboard**: https://app.brevo.com/
- **API Keys**: https://app.brevo.com/settings/keys/api
- **Senders**: https://app.brevo.com/settings/senders
- **Email Logs**: https://app.brevo.com/transactional/email/logs
- **IP Security**: https://app.brevo.com/security/authorised_ips
- **Status**: https://status.brevo.com/

### Support
- **Brevo Help Center**: https://help.brevo.com/
- **Brevo Community**: https://community.brevo.com/

---

## Summary

This guide provides everything you need to migrate from SendGrid to Brevo:

1. ✅ **Account Setup** - Create Brevo account and get API key
2. ✅ **Email Verification** - Verify sender email (critical!)
3. ✅ **Code Implementation** - Complete email service code
4. ✅ **Testing** - Test script and verification steps
5. ✅ **Troubleshooting** - Common issues and solutions
6. ✅ **Migration Checklist** - Step-by-step checklist

**Key Takeaways:**
- Brevo integration is straightforward
- No additional dependencies needed (Node.js 18+)
- Same function signatures as SendGrid (easy migration)
- Good error handling for common issues
- Free tier sufficient for most projects

**Time Estimate:** 30-60 minutes for complete migration

---

**Good luck with your migration! 🚀**

If you encounter any issues not covered in this guide, refer to the Brevo documentation or check the troubleshooting section.

