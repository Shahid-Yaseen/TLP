# Physical Device Setup Guide

## Problem: Login Not Working on Physical Phone

When testing on a **physical phone**, `localhost` doesn't work because the phone can't reach your development server. You need to use your **computer's IP address** instead.

## Quick Fix

### Step 1: Find Your Computer's IP Address

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or
ipconfig getifaddr en0
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Common IP formats:**
- `192.168.x.x` (most common)
- `10.0.x.x`
- `172.16.x.x - 172.31.x.x`

### Step 2: Update app.json

Edit `mobile/app.json` and update the API URL:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP_ADDRESS:3007"
    }
  }
}
```

**Example:**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.0.102:3007"
    }
  }
}
```

### Step 3: Restart Expo Server

After updating `app.json`, you must restart the Expo server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd mobile
npm start -- --clear
```

### Step 4: Make Sure Phone and Computer Are on Same Network

- Both devices must be on the **same Wi-Fi network**
- Check your phone's Wi-Fi settings
- Check your computer's network connection

### Step 5: Verify API Server is Accessible

Test from your phone's browser:
1. Open a browser on your phone
2. Go to: `http://YOUR_IP_ADDRESS:3007/api/health` (or any API endpoint)
3. You should see a response (or an error page, but not "connection refused")

## Alternative: Use .env File

Instead of editing `app.json`, you can create a `.env` file:

1. Create `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.0.102:3007
```

2. Restart Expo server

## Platform-Specific Notes

### iOS Physical Device
- Use your computer's IP: `http://192.168.0.102:3007`
- Make sure both devices are on the same Wi-Fi

### Android Physical Device
- Use your computer's IP: `http://192.168.0.102:3007`
- Make sure both devices are on the same Wi-Fi

### iOS Simulator (Mac)
- `localhost` works fine: `http://localhost:3007`

### Android Emulator
- Use `10.0.2.2`: `http://10.0.2.2:3007` (automatically handled)

### Web Browser
- `localhost` works fine: `http://localhost:3007`

## Troubleshooting

### "Network request failed" or "Connection refused"

1. **Check IP address is correct**
   ```bash
   # Verify your IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Check API server is running**
   ```bash
   # In another terminal
   curl http://localhost:3007/api/health
   ```

3. **Check firewall settings**
   - Make sure your firewall allows connections on port 3007
   - On Mac: System Preferences > Security & Privacy > Firewall
   - Temporarily disable firewall to test

4. **Check same network**
   - Phone and computer must be on the same Wi-Fi
   - Some networks block device-to-device communication
   - Try a different network if needed

5. **Test from phone browser**
   - Open `http://YOUR_IP:3007/api/health` on your phone
   - If this doesn't work, the API server isn't accessible

### "CORS error" (if testing in browser)

If you see CORS errors, make sure your API server allows requests from your phone's IP. Check your API's CORS configuration.

### IP Address Changed?

If your computer's IP changes (common with DHCP), you'll need to update `app.json` again. Consider:
- Setting a static IP on your computer
- Using a service like ngrok for development (not recommended for production)

## Current Configuration

Your current IP appears to be: **192.168.0.102**

Update `app.json`:
```json
"extra": {
  "apiUrl": "http://192.168.0.102:3007"
}
```

## Verification

After updating, check the console logs when the app starts. You should see:
```
API URL configured: http://192.168.0.102:3007 Platform: ios
```

If you see a warning about localhost on physical device, the configuration didn't take effect - restart the Expo server.

