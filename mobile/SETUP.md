# TLP Mobile App Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Emulator (for testing)
- Physical device with Expo Go app (optional, for testing on real device)

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

The app uses environment variables for API configuration. You have two options:

**Option A: Using app.json (Recommended for Expo)**
- Edit `app.json` and update the `extra.apiUrl` field:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://your-api-url:3007"
    }
  }
}
```

**Option B: Using .env file**
- Create a `.env` file in the `mobile` directory:
```
EXPO_PUBLIC_API_URL=http://your-api-url:3007
```

For local development, use:
- iOS Simulator: `http://localhost:3007`
- Android Emulator: `http://10.0.2.2:3007` (Android emulator localhost mapping)
- Physical device: `http://YOUR_COMPUTER_IP:3007` (replace with your computer's local IP)

### 3. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code for testing on physical devices

### 4. Run on iOS

```bash
npm run ios
```

Or press `i` in the Expo CLI after running `npm start`.

**Requirements:**
- macOS with Xcode installed
- iOS Simulator available

### 5. Run on Android

```bash
npm run android
```

Or press `a` in the Expo CLI after running `npm start`.

**Requirements:**
- Android Studio installed
- Android Emulator set up and running

### 6. Test on Physical Device

1. Install **Expo Go** app from App Store (iOS) or Google Play (Android)
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## Project Structure

```
mobile/
├── App.js                      # Root component
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── src/
│   ├── config/                # API configuration
│   ├── contexts/               # React contexts (Auth)
│   ├── navigation/            # Navigation setup
│   ├── screens/               # Screen components
│   ├── components/            # Reusable components
│   ├── services/             # API service layer
│   ├── utils/                # Utilities
│   └── styles/               # Theme and styles
└── assets/                   # Images, fonts, etc.
```

## API Endpoints

The mobile app uses the same API endpoints as the web app:

- **Authentication**: `/api/auth/*`
- **Launches**: `/api/launches/*`
- **News**: `/api/news/*`
- **Spacebase**: `/api/spacebase/*` (astronauts, rockets, engines, etc.)
- **Users**: `/api/users/*`
- **Statistics**: `/api/statistics/*`

## Troubleshooting

### Issue: Cannot connect to API

**Solution:**
- Verify your API server is running
- Check the API URL in `app.json` or `.env`
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's IP address
- Ensure your firewall allows connections on port 3007

### Issue: Metro bundler errors

**Solution:**
```bash
# Clear cache and restart
npm start -- --clear
```

### Issue: Dependencies not installing

**Solution:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: iOS build fails

**Solution:**
- Ensure Xcode is properly installed
- Run `xcode-select --install` if needed
- Check that iOS Simulator is available

### Issue: Android build fails

**Solution:**
- Ensure Android Studio is installed
- Set up Android SDK and emulator
- Check `ANDROID_HOME` environment variable

## Development Tips

1. **Hot Reload**: Changes are automatically reflected (enabled by default)
2. **Debugging**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open developer menu
3. **Logs**: Check terminal for console logs, or use React Native Debugger
4. **API Testing**: Use the same API as the web app for consistency

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

Or use EAS Build (recommended):

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Next Steps

1. Test all screens and navigation flows
2. Verify API integration with your backend
3. Customize app icons and splash screens in `app.json`
4. Add app-specific features and optimizations
5. Set up push notifications (if needed)
6. Configure app store listings

## Support

For issues or questions:
- Check Expo documentation: https://docs.expo.dev/
- React Navigation docs: https://reactnavigation.org/
- React Native docs: https://reactnative.dev/


