# How to Access the TLP Mobile App

## Quick Start Guide

The Expo development server is already running! Here are the ways to access your app:

## Method 1: Using Expo Go App (Physical Device) - Easiest

### Step 1: Install Expo Go
- **iOS**: Download "Expo Go" from the App Store
- **Android**: Download "Expo Go" from Google Play Store

### Step 2: Connect to the Server
1. Make sure your phone and computer are on the **same Wi-Fi network**
2. Look at the terminal where Expo is running
3. You should see a **QR code** displayed
4. **Scan the QR code** with:
   - **iOS**: Use the Camera app (it will detect the QR code)
   - **Android**: Use the Expo Go app's built-in scanner

### Step 3: Open in Expo Go
- The app will automatically load in Expo Go
- You'll see the TLP Network app

## Method 2: iOS Simulator (Mac Only)

### Step 1: Open iOS Simulator
```bash
# In the terminal where Expo is running, press:
i
```

Or manually:
```bash
cd mobile
npm run ios
```

### Step 2: Wait for Build
- The simulator will open automatically
- First time may take a few minutes to build
- The app will appear in the simulator

## Method 3: Android Emulator

### Step 1: Start Android Emulator
- Open Android Studio
- Start an Android Virtual Device (AVD)
- Wait for emulator to fully boot

### Step 2: Open App
```bash
# In the terminal where Expo is running, press:
a
```

Or manually:
```bash
cd mobile
npm run android
```

## Method 4: Web Browser (Limited)

```bash
# In the terminal where Expo is running, press:
w
```

Or manually:
```bash
cd mobile
npm run web
```

**Note**: Web version has limited functionality compared to native mobile.

## Troubleshooting

### Can't See QR Code?
1. Check the terminal output - it should show the QR code
2. If not visible, try:
   ```bash
   cd mobile
   npm start -- --clear
   ```

### Can't Connect from Phone?
1. **Check Wi-Fi**: Phone and computer must be on same network
2. **Check Firewall**: Allow port 8081 in your firewall
3. **Use Tunnel Mode**:
   ```bash
   cd mobile
   npm start -- --tunnel
   ```
   This uses Expo's servers (slower but works across networks)

### App Not Loading?
1. **Check API Server**: Make sure your backend API is running on port 3007
2. **Check API URL**: Verify the API URL in `app.json` is correct
3. **Check Console**: Look for errors in the terminal or Expo DevTools

### Expo DevTools Not Opening?
- Manually open: http://localhost:19002
- Or check the terminal for the URL

## Current Server Status

Your Expo server should be running. Check the terminal for:
- ✅ Metro bundler running
- ✅ QR code displayed
- ✅ Options to press `i`, `a`, or `w`

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start server | `npm start` |
| iOS Simulator | Press `i` or `npm run ios` |
| Android Emulator | Press `a` or `npm run android` |
| Web Browser | Press `w` or `npm run web` |
| Clear cache | `npm start -- --clear` |
| Tunnel mode | `npm start -- --tunnel` |

## What You Should See

Once the app loads, you should see:
1. **Login Screen** (if not authenticated)
2. **Home Tab** with featured content
3. **Bottom Navigation** with 5 tabs:
   - Home
   - Launches
   - News
   - Spacebase
   - Profile

## Next Steps

1. **Test Login**: Try logging in with your credentials
2. **Browse Launches**: Check the Launch Center
3. **Read News**: Browse articles
4. **Explore Spacebase**: View astronauts, rockets, etc.

## Need Help?

- Check the terminal for error messages
- Open Expo DevTools: http://localhost:19002
- Check `SETUP.md` for detailed setup instructions
- Check `API_URL_CONFIG.md` for API configuration



