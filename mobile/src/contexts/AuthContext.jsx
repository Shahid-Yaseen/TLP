import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { 
  getAccessToken, 
  setAccessToken, 
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken 
} from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await getAccessToken();
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Token might be invalid, clear it
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { access_token, refresh_token, user: userData } = response.data;

      // Store tokens
      await setAccessToken(access_token);
      if (refresh_token) {
        await setRefreshToken(refresh_token);
      }

      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (email, password, first_name, last_name, username) => {
    try {
      // Generate username from email if not provided
      const generatedUsername = username || email.split('@')[0];
      
      await api.post('/auth/register', {
        email,
        password,
        username: generatedUsername,
        first_name,
        last_name,
      });

      // Auto-login after successful registration
      const loginResult = await login(email, password);
      
      if (loginResult.success) {
        return { success: true, message: 'Registration successful' };
      } else {
        return {
          success: false,
          error: 'Registration successful, but automatic login failed. Please log in manually.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    // Clear tokens
    await removeAccessToken();
    await removeRefreshToken();

    setToken(null);
    setUser(null);
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token } = response.data;
      await setAccessToken(access_token);
      setToken(access_token);

      return access_token;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshAccessToken,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

