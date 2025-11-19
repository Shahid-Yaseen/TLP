/**
 * Test API connection from mobile app
 * Use this to debug connection issues
 */

import API_URL from '../config/api';
import axios from 'axios';

export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    console.log('API URL:', API_URL);
    
    // Test health endpoint
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
    });
    
    console.log('✅ Connection successful!');
    console.log('Response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Request URL:', `${API_URL}/health`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not reachable. Check:');
      console.error('1. Server is running');
      console.error('2. Correct IP address:', API_URL);
      console.error('3. Phone and computer on same network');
      console.error('4. Firewall allows connections');
    }
    
    return { success: false, error: error.message, code: error.code };
  }
};

export const testLoginEndpoint = async (email, password) => {
  try {
    console.log('🔍 Testing login endpoint...');
    console.log('API URL:', API_URL);
    console.log('Endpoint:', `${API_URL}/api/auth/login`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    }, {
      timeout: 10000,
    });
    
    console.log('✅ Login endpoint accessible!');
    console.log('Response status:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('❌ Login endpoint test failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

