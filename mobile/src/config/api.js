// Centralized API configuration
// Uses EXPO_PUBLIC_API_URL environment variable, falls back to localhost for development
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get API URL from config or environment
let API_URL = Constants.expoConfig?.extra?.apiUrl || 
              process.env.EXPO_PUBLIC_API_URL || 
              'http://localhost:3007';

// For Android emulator, automatically use 10.0.2.2 instead of localhost
if (Platform.OS === 'android' && API_URL.includes('localhost')) {
  API_URL = API_URL.replace('localhost', '10.0.2.2');
}

// For web platform, ensure we use the correct localhost URL
if (Platform.OS === 'web' && !API_URL.includes('localhost') && !API_URL.includes('127.0.0.1')) {
  // If no explicit API URL is set for web, use localhost
  API_URL = 'http://localhost:3007';
}

console.log('API URL configured:', API_URL, 'Platform:', Platform.OS);

export default API_URL;

