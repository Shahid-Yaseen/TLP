# Debug Login Issue - Step by Step

## Current Status
- ✅ API server is running on `0.0.0.0:3007`
- ✅ API works from browser (localhost)
- ❌ Login fails from mobile app

## Step 1: Verify API URL Configuration

Check the console logs when the app starts. You should see:
```
API URL configured: http://192.168.0.102:3007 Platform: ios Device: Physical
```

**If you see `localhost` instead**, the app.json changes didn't take effect.

### Fix: Restart Expo with cleared cache
```bash
cd mobile
npm start -- --clear
```

Then reload the app on your phone (shake device > Reload).

## Step 2: Test Connection from Phone Browser

1. Open Safari/Chrome on your phone
2. Go to: `http://192.168.0.102:3007/health`
3. You should see: `{"status":"ok",...}`

**If this doesn't work**, the phone can't reach your computer. Check:
- Phone and computer on same Wi-Fi network
- Firewall settings
- IP address is correct

## Step 3: Check Console Logs

When you try to login, check the console for:

### Expected logs:
```
🔐 Attempting login...
Email: your@email.com
API URL configured: http://192.168.0.102:3007
🌐 Network Error Details:
  - Error Code: ...
  - Error Message: ...
  - Request URL: http://192.168.0.102:3007/api/auth/login
```

### Common errors:

**ECONNREFUSED**
- Server not reachable
- Wrong IP address
- Firewall blocking

**ENOTFOUND**
- DNS resolution failed
- Wrong IP address format

**Network request failed**
- Phone can't reach server
- Network connectivity issue

**401 Unauthorized**
- Wrong email/password
- User doesn't exist

**500 Internal Server Error**
- Server-side error
- Check API server logs

## Step 4: Test Login Endpoint Directly

From your phone's browser, try:
```
http://192.168.0.102:3007/api/auth/login
```

You should get a validation error (expected - it needs POST data), but it proves the endpoint is reachable.

## Step 5: Check API Server Logs

When you try to login, check the API server terminal. You should see:
```
POST /api/auth/login
```

**If you don't see this**, the request isn't reaching the server.

## Step 6: Verify Request is Being Sent

Add this to Login.jsx temporarily to see the actual request:

```javascript
const result = await login(email, password);
console.log('Login result:', JSON.stringify(result, null, 2));
```

## Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution**: 
1. Verify server is running: `curl http://localhost:3007/health`
2. Check IP address in app.json matches your computer's IP
3. Test from phone browser first
4. Check firewall settings

### Issue: "Invalid email or password" (but credentials are correct)
**Solution**:
1. Check if user exists in database
2. Verify password hash is correct
3. Check API server logs for actual error

### Issue: No error shown, but login doesn't work
**Solution**:
1. Check console logs for hidden errors
2. Verify navigation is working
3. Check if token is being stored

### Issue: Works in browser but not phone
**Solution**:
1. Browser uses `localhost` (works)
2. Phone needs IP address (check app.json)
3. Restart Expo after changing app.json
4. Clear cache: `npm start -- --clear`

## Quick Test Commands

```bash
# 1. Check server is running
curl http://localhost:3007/health

# 2. Check server listens on all interfaces
lsof -i:3007 | grep LISTEN
# Should show: *:3007 or 0.0.0.0:3007

# 3. Test from your IP
curl http://192.168.0.102:3007/health

# 4. Test login endpoint (should return validation error)
curl -X POST http://192.168.0.102:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Next Steps

1. **Check console logs** when attempting login
2. **Test from phone browser** to verify connectivity
3. **Check API server logs** for incoming requests
4. **Share the exact error message** you're seeing

## Need More Help?

Share:
1. The exact error message shown in the app
2. Console logs from Expo
3. API server logs when you try to login
4. Result of phone browser test

