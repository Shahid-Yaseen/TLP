import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

export const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export const getAccessToken = () => storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
export const setAccessToken = (token) => storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
export const removeAccessToken = () => storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

export const getRefreshToken = () => storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
export const setRefreshToken = (token) => storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
export const removeRefreshToken = () => storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

