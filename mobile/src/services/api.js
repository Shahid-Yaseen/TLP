import axios from 'axios';
import API_URL from '../config/api';
import { getAccessToken, setAccessToken, removeAccessToken, removeRefreshToken, getRefreshToken } from '../utils/storage';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // Increased to 30 seconds for sync operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Enhanced error logging for network issues
    if (!error.response) {
      // Network error (no response from server)
      console.error('🌐 Network Error Details:');
      console.error('  - Error Code:', error.code);
      console.error('  - Error Message:', error.message);
      console.error('  - Request URL:', `${error.config?.baseURL}${error.config?.url}`);
      console.error('  - API URL configured:', API_URL);
      console.error('  - Full error:', error);
      
      // Add more helpful error message
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network request failed')) {
        error.userMessage = `Cannot connect to server at ${API_URL}. Please check:
1. API server is running
2. Correct IP address in app.json
3. Phone and computer on same Wi-Fi network
4. Firewall allows connections on port 3007`;
      } else if (error.code === 'ETIMEDOUT') {
        error.userMessage = 'Request timed out. Server may be slow or unreachable.';
      } else {
        error.userMessage = `Network error: ${error.message || 'Unable to connect to server'}`;
      }
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          await setAccessToken(access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await removeAccessToken();
        await removeRefreshToken();
        // Navigation will be handled by AuthContext
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

