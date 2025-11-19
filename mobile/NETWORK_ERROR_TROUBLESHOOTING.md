# Network Error Troubleshooting Guide

## Common Axios Network Errors

### Error: "Network request failed" or "ECONNREFUSED"

This means your phone cannot reach the API server. Follow these steps:

## Step 1: Verify API Server is Running

```bash
# Check if server is running
curl http://localhost:3007/health

# Should return: {"status":"ok","timestamp":"..."}
```

If this doesn't work, start your API server:
```bash
cd api
npm start
```

## Step 2: Check API Server is Listening on All Interfaces

**IMPORTANT**: The server must listen on `0.0.0.0`, not just `localhost`, to accept connections from your phone.

Check `api/index.js`:
```javascript
// Should be:
app.listen(PORT, '0.0.0.0', () => {
  // ...
});

// NOT:
app.listen(PORT, () => {  // This only listens on localhost
  // ...
});
```

If it's not listening on `0.0.0.0`, update it:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Server running on port ${PORT}`);
  // ...
});
```

## Step 3: Verify Your IP Address

```bash
# On Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig
```

Look for your local network IP (usually `192.168.x.x` or `10.0.x.x`).

## Step 4: Update app.json

Make sure `app.json` has your computer's IP:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.0.102:3007"
    }
  }
}
```

**Replace `192.168.0.102` with YOUR computer's IP address.**

## Step 5: Restart Expo Server

After updating `app.json`:

```bash
# Stop current server (Ctrl+C)
# Then restart with cleared cache
cd mobile
npm start -- --clear
```

## Step 6: Test Connection from Phone

1. Open a browser on your phone
2. Go to: `http://YOUR_IP:3007/health`
3. You should see: `{"status":"ok",...}`

If this doesn't work, the server isn't accessible from your phone.

## Step 7: Check Firewall

### Mac
1. System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Make sure Node.js or Terminal is allowed
4. Or temporarily disable firewall to test

### Windows
1. Windows Defender Firewall
2. Allow Node.js through firewall
3. Or temporarily disable to test

### Linux
```bash
# Check firewall status
sudo ufw status

# Allow port 3007
sudo ufw allow 3007/tcp
```

## Step 8: Verify Same Network

- Phone and computer must be on the **same Wi-Fi network**
- Check phone's Wi-Fi settings
- Check computer's network connection
- Some networks block device-to-device communication

## Step 9: Check Console Logs

When the app starts, check the console for:
```
API URL configured: http://192.168.0.102:3007 Platform: ios Device: Physical
```

If you see `localhost` instead of your IP, the configuration didn't take effect.

## Common Issues

### Issue: "ECONNREFUSED"
**Solution**: Server not running or not listening on `0.0.0.0`

### Issue: "ENOTFOUND"
**Solution**: Wrong IP address in `app.json`

### Issue: "ETIMEDOUT"
**Solution**: Firewall blocking or server too slow

### Issue: Works in browser but not phone
**Solution**: Browser uses `localhost` (works), phone needs IP address

### Issue: IP address changed
**Solution**: Update `app.json` with new IP and restart Expo

## Quick Diagnostic Commands

```bash
# 1. Check server is running
curl http://localhost:3007/health

# 2. Check server listens on all interfaces
netstat -an | grep 3007
# Should show: 0.0.0.0:3007 or *:3007

# 3. Test from phone's IP
curl http://192.168.0.102:3007/health
# Replace with your IP

# 4. Check your IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Still Not Working?

1. **Try a different network** - Some Wi-Fi networks block device-to-device communication
2. **Use ngrok** (temporary solution):
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Create tunnel
   ngrok http 3007
   
   # Use the ngrok URL in app.json
   # Example: "apiUrl": "https://abc123.ngrok.io"
   ```
3. **Check API server logs** - Look for connection attempts
4. **Try Android emulator** - Uses `10.0.2.2` which is automatically configured

## Verification Checklist

- [ ] API server is running (`curl http://localhost:3007/health` works)
- [ ] Server listens on `0.0.0.0` (check `api/index.js`)
- [ ] Correct IP address in `app.json`
- [ ] Expo server restarted after changing `app.json`
- [ ] Phone and computer on same Wi-Fi network
- [ ] Firewall allows port 3007
- [ ] Can access `http://YOUR_IP:3007/health` from phone browser
- [ ] Console shows correct API URL (not localhost)

## Need Help?

Check the console logs in:
- Expo DevTools (browser)
- Terminal running `npm start`
- React Native Debugger

Look for:
- API URL configuration messages
- Network error details
- Request URLs being called

