# TLP Network Mobile App

React Native mobile application for TLP Network using Expo.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Create a `.env` file (or use `.env.example` as template)
- Set `API_URL` to your API endpoint (default: `http://localhost:3007`)

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── config/          # API configuration
│   ├── contexts/         # React contexts (Auth)
│   ├── navigation/       # Navigation setup
│   ├── screens/          # Screen components
│   ├── components/      # Reusable components
│   ├── services/        # API service layer
│   ├── utils/           # Utilities (storage, constants)
│   └── styles/          # Theme and styles
├── assets/              # Images, fonts, etc.
├── App.js              # Root component
└── app.json            # Expo configuration
```

## Features

- Authentication (Login, Register, Forgot Password, Email Verification)
- Launch Center with filters
- News articles with categories
- Spacebase (Astronauts, Rockets, Engines, Spacecraft, Facilities, Pads, Agencies)
- User Profile
- About Us page

## API Integration

The app uses the same API endpoints as the web application. Configure the API URL in `.env` or `app.json`.

## Notes

- Uses React Navigation for navigation
- AsyncStorage for token persistence
- Axios for API calls
- Custom theme matching web app design

