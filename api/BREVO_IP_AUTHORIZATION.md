# Brevo IP Authorization Setup

## ⚠️ Issue Detected

Brevo has detected that you're using an **unrecognised IP address** and is blocking API requests for security reasons.

**Error Message:**
```
We have detected you are using an unrecognised IP address [YOUR_IP]. 
If you performed this action make sure to add the new IP address in this link: 
https://app.brevo.com/security/authorised_ips
```

## 🔧 Solution Options

### Option 1: Add IP Address to Authorized List (Recommended for Production)

1. Go to **Brevo Security Settings**: https://app.brevo.com/security/authorised_ips
2. Click **"Add an IP address"**
3. Enter your current IP address: **116.71.165.141**
4. Click **"Add"**
5. The IP will be immediately authorized

**Note:** If your server has a dynamic IP or you're testing from different locations, you may need to add multiple IPs or use Option 2.

### Option 2: Disable IP Restrictions (For Development/Testing)

1. Go to **Brevo Security Settings**: https://app.brevo.com/security/authorised_ips
2. Look for **"IP Restrictions"** or **"Authorized IPs"** section
3. Find the option to **disable IP restrictions** or **allow all IPs**
4. Save the changes

**⚠️ Warning:** Disabling IP restrictions is less secure but convenient for development or if your server IP changes frequently.

### Option 3: Use Brevo SMTP Instead (Alternative)

If IP restrictions are problematic, you can use Brevo's SMTP relay instead of the API:

1. Get SMTP credentials from: https://app.brevo.com/settings/smtp
2. Use nodemailer with SMTP (see `BREVO_OTP_INTEGRATION_GUIDE.md`)

## 🧪 After Fixing IP Authorization

Once you've authorized your IP or disabled restrictions, test again:

```bash
cd api
npm run test:email contact@tlpnetwork.com "Test User"
```

## 📋 Current IP Address

Your current IP address: **116.71.165.141**

Add this to your authorized IPs list in Brevo.

## 🔍 How to Find Your Server IP

If you need to find your server's IP address:

```bash
# On Linux/Mac
curl ifconfig.me

# Or
curl ipinfo.io/ip
```

## ✅ Verification Checklist

- [ ] IP address added to Brevo authorized IPs
- [ ] OR IP restrictions disabled in Brevo
- [ ] Test email sent successfully
- [ ] Email received in inbox

---

**Quick Link:** https://app.brevo.com/security/authorised_ips

