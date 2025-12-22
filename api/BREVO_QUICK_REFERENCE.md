# Brevo Integration - Quick Reference Card

## 🚀 Quick Setup (5 Minutes)

### 1. Get API Key
```
https://app.brevo.com/settings/keys/api
→ Generate new API key
→ Copy: xkeysib-xxxxxxxxxxxxx
```

### 2. Verify Sender Email
```
https://app.brevo.com/settings/senders
→ Add sender: your-email@domain.com
→ Verify via email
```

### 3. Update .env
```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx
FROM_EMAIL=your-email@domain.com
FROM_NAME=Your App Name
APP_NAME=Your App Name
```

### 4. Remove SendGrid
```bash
npm uninstall @sendgrid/mail
```

### 5. Replace Email Service
Copy the email service code from `COMPLETE_BREVO_INTEGRATION_GUIDE.md` (Step 7)

### 6. Test
```bash
node scripts/test-brevo-email.js your-email@example.com "Test"
```

---

## 📝 Code Template

```javascript
// services/emailService.js
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME || 'Your App';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail(to, subject, htmlContent, textContent) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return { success: true, messageId: data.messageId };
}
```

---

## 🔗 Essential Links

| Purpose | URL |
|---------|-----|
| **Dashboard** | https://app.brevo.com/ |
| **API Keys** | https://app.brevo.com/settings/keys/api |
| **Senders** | https://app.brevo.com/settings/senders |
| **Email Logs** | https://app.brevo.com/transactional/email/logs |
| **IP Security** | https://app.brevo.com/security/authorised_ips |
| **API Docs** | https://developers.brevo.com/docs/send-a-transactional-email |

---

## ⚠️ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| **Invalid API key** | Check `.env` file, regenerate key |
| **Sender not verified** | Verify email at: /settings/senders |
| **IP not authorized** | Add IP at: /security/authorised_ips |
| **Rate limit exceeded** | Wait or upgrade plan (300/day free) |

---

## ✅ Migration Checklist

- [ ] Brevo account created
- [ ] API key generated
- [ ] Sender email verified
- [ ] `.env` updated
- [ ] SendGrid removed
- [ ] Code updated
- [ ] Test email sent
- [ ] IP authorized (if needed)

---

## 📊 API Endpoint

```
POST https://api.brevo.com/v3/smtp/email
Headers:
  api-key: xkeysib-xxxxxxxxxxxxx
  content-type: application/json
```

---

**Full Guide:** See `COMPLETE_BREVO_INTEGRATION_GUIDE.md`

