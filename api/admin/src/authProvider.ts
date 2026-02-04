import { AuthProvider } from 'react-admin';
import { getApiUrl } from './config/api';

export const authProvider: AuthProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invalid email or password');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return Promise.resolve();
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await fetch(`${getApiUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return Promise.reject();
    }

    // Optionally verify token is still valid
    try {
      const response = await fetch(`${getApiUrl()}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await fetch(`${getApiUrl()}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('access_token', data.access_token);
            return Promise.resolve();
          }
        }
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return Promise.reject();
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject();
    }
  },

  checkError: (error: any) => {
    const status = error?.status || error?.response?.status;
    
    if (status === 401 || status === 403) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return Promise.reject();
    }
    
    return Promise.resolve();
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return Promise.reject();
    }

    const user = JSON.parse(userStr);
    return Promise.resolve({
      id: user.id,
      fullName: user.full_name || user.email || user.username,
      avatar: user.profile_image_url,
    });
  },

  getPermissions: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return Promise.resolve('');
    }

    const user = JSON.parse(userStr);
    const roles = user.roles || [];
    
    if (roles.some((r: any) => r.name === 'admin' || r === 'admin')) {
      return Promise.resolve('admin');
    }
    
    return Promise.resolve('');
  },
};
