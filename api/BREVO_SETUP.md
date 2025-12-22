# Brevo Email Integration - Quick Setup Guide

## ✅ Implementation Complete

The email service has been successfully migrated from SendGrid to Brevo using the **Direct API approach** (recommended method).

## 🚀 Quick Start

### 1. Get Your Brevo API Key

1. Sign up or log in at https://app.brevo.com/
2. Navigate to **Settings → API Keys** (https://app.brevo.com/settings/keys/api)
3. Click **"Generate a new API key"**
4. Copy the API key (format: `xkeysib-xxxxxxxxxxxxxxxxx`)

### 2. Register Sender Email

1. Go to **Senders & IP → Senders** (https://app.brevo.com/settings/senders)
2. Click **"Add a new sender"**
3. Enter your email address and name
4. Verify the email address (check your inbox for verification email)

### 3. Update Environment Variables

Add these to your `.env` file in the `api/` directory:

```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=TLP Platform
APP_NAME=TLP Platform
```

**Important:** Replace `xkeysib-xxxxxxxxxxxxxxxxx` with your actual Brevo API key.

### 4. Remove SendGrid Dependency

Run this command to remove the old SendGrid package:

```bash
cd api
npm uninstall @sendgrid/mail
```

### 5. Test the Integration

Test the email service with:

```bash
# Using npm script
npm run test:email your-email@example.com "Your Name"

# Or directly
node scripts/test-brevo-email.js your-email@example.com "Your Name"
```

**Example:**
```bash
npm run test:email test@example.com "Test User"
```

You should receive an email with a 6-digit verification code.

## 📋 What Changed

### Files Modified:
- ✅ `api/services/emailService.js` - Migrated from SendGrid to Brevo API
- ✅ `api/package.json` - Removed `@sendgrid/mail` dependency

### Files Created:
- ✅ `api/scripts/test-brevo-email.js` - Test script for email integration
- ✅ `api/BREVO_OTP_INTEGRATION_GUIDE.md` - Comprehensive integration guide
- ✅ `api/BREVO_SETUP.md` - This quick setup guide

## 🔍 Verification Checklist

- [ ] Brevo account created
- [ ] API key generated and added to `.env`
- [ ] Sender email registered and verified in Brevo
- [ ] Environment variables updated in `.env`
- [ ] SendGrid package removed (`npm uninstall @sendgrid/mail`)
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Checked Brevo dashboard for delivery status

## 🧪 Testing

### Test Email Sending

```bash
npm run test:email your-email@example.com "Your Name"
```

### Expected Output

```
🧪 Testing Brevo Email Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Recipient: your-email@example.com
👤 Username: Your Name
🔢 Verification Code: 123456
🔑 API Key: xkeysib-xxxxx...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 Sending test email...

✅ SUCCESS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Email sent successfully!
📨 Message ID: <201798300811.5787683@relay.domain.com>
📧 Check inbox: your-email@example.com
🔢 Test Code: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🐛 Troubleshooting

### Error: "BREVO_API_KEY not configured"
- **Solution**: Make sure `BREVO_API_KEY` is set in your `.env` file
- Check that the `.env` file is in the `api/` directory

### Error: "Invalid API key"
- **Solution**: Verify your API key is correct
- Get a new API key from: https://app.brevo.com/settings/keys/api
- Make sure the key starts with `xkeysib-`

### Error: "Sender email not verified"
- **Solution**: Register and verify your sender email
- Go to: https://app.brevo.com/settings/senders
- Add your email and verify it

### Error: "Rate limit exceeded"
- **Solution**: Wait a few minutes and try again
- Check your Brevo plan limits
- Free tier: 300 emails/day

### Email Not Received
1. Check spam/junk folder
2. Verify sender email is correct in Brevo dashboard
3. Check Brevo dashboard → Transactional → Email Logs
4. Verify recipient email address is correct

## 📊 Monitoring

### Check Email Status

1. Go to **Transactional → Email Logs** in Brevo dashboard
2. View delivery status, opens, clicks, bounces
3. Monitor for any delivery issues

### Brevo Dashboard Links

- **API Keys**: https://app.brevo.com/settings/keys/api
- **Senders**: https://app.brevo.com/settings/senders
- **Email Logs**: https://app.brevo.com/transactional/email/logs
- **Webhooks**: https://app.brevo.com/transactional/webhooks

## 🔄 Integration Status

✅ **Email Service**: Migrated to Brevo  
✅ **OTP Flow**: Unchanged (6-digit codes, 10-minute expiration)  
✅ **Database Schema**: No changes needed  
✅ **API Routes**: No changes needed  
✅ **Frontend**: No changes needed  

The integration is **backward compatible** - all existing functionality works the same way, just using Brevo instead of SendGrid.

## 📚 Additional Resources

- **Full Integration Guide**: See `BREVO_OTP_INTEGRATION_GUIDE.md`
- **Brevo API Docs**: https://developers.brevo.com/docs/send-a-transactional-email
- **Brevo Dashboard**: https://app.brevo.com/
- **Brevo Status**: https://status.brevo.com/

## 🎉 Next Steps

1. ✅ Complete the setup checklist above
2. ✅ Test email sending
3. ✅ Test the full registration → verification flow
4. ✅ Monitor email delivery in Brevo dashboard
5. ✅ (Optional) Set up webhooks for delivery tracking

---

**Need Help?** Check the comprehensive guide in `BREVO_OTP_INTEGRATION_GUIDE.md` for detailed information.

