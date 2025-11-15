# API URL Configuration Guide

## Current Configuration

The API URL is configured in `app.json`:
```json
"extra": {
  "apiUrl": "http://localhost:3007"
}
```

## Platform-Specific API URLs

### iOS Simulator
- Use: `http://localhost:3007`
- This works out of the box

### Android Emulator
- Use: `http://10.0.2.2:3007`
- Android emulator maps `10.0.2.2` to your host machine's `localhost`

### Physical Device (iOS/Android)
- Use: `http://YOUR_COMPUTER_IP:3007`
- Find your IP:
  - Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
  - Windows: `ipconfig` (look for IPv4 Address)
- Example: `http://192.168.1.100:3007`

## How to Change API URL

### Option 1: Edit app.json (Recommended)
1. Open `mobile/app.json`
2. Update the `extra.apiUrl` value:
```json
"extra": {
  "apiUrl": "http://your-api-url:3007"
}
```
3. Restart the Expo server

### Option 2: Use Environment Variable
1. Create `.env` file in `mobile/` directory:
```
EXPO_PUBLIC_API_URL=http://your-api-url:3007
```
2. The `src/config/api.js` will automatically use this value

### Option 3: Production API
For production, update to your production API URL:
```json
"extra": {
  "apiUrl": "https://api.yourdomain.com"
}
```

## Testing API Connection

1. Ensure your API server is running on port 3007
2. Test the connection:
   - iOS Simulator: Open Safari and go to `http://localhost:3007/health`
   - Android Emulator: Use `http://10.0.2.2:3007/health`
   - Physical Device: Use `http://YOUR_IP:3007/health`

## Quick Reference

| Platform | API URL Format |
|----------|---------------|
| iOS Simulator | `http://localhost:3007` |
| Android Emulator | `http://10.0.2.2:3007` |
| Physical Device | `http://YOUR_IP:3007` |
| Production | `https://api.yourdomain.com` |

## Notes

- After changing the API URL, restart the Expo development server
- Make sure your API server allows CORS from your mobile app
- For physical device testing, ensure your computer and device are on the same network



