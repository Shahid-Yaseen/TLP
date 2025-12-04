/**
 * Satellite API Service
 * Handles API calls to backend satellite endpoints
 */

import axios from 'axios';
import API_URL from '../config/api';

/**
 * Fetch filtered satellites
 */
export async function fetchSatellites(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.constellation) params.append('constellation', filters.constellation);
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await axios.get(`${API_URL}/api/satellites?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching satellites:', error);
    throw error;
  }
}

/**
 * Fetch single satellite details
 */
export async function fetchSatelliteDetails(noradId) {
  try {
    const response = await axios.get(`${API_URL}/api/satellites/${noradId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching satellite details:', error);
    throw error;
  }
}

/**
 * Fetch current 3D positions for multiple satellites
 */
export async function fetchSatellitePositions(noradIds, timestamp = null) {
  try {
    const params = new URLSearchParams();
    
    if (Array.isArray(noradIds)) {
      noradIds.forEach(id => params.append('norad_ids[]', id));
    } else {
      params.append('norad_ids', noradIds);
    }
    
    if (timestamp) {
      params.append('timestamp', timestamp);
    }

    const response = await axios.get(`${API_URL}/api/satellites/positions?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching satellite positions:', error);
    throw error;
  }
}

/**
 * Fetch statistics
 */
export async function fetchStatistics() {
  try {
    const response = await axios.get(`${API_URL}/api/satellites/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

/**
 * Trigger cache refresh (admin only)
 */
export async function refreshCache() {
  try {
    const response = await axios.post(`${API_URL}/api/satellites/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    throw error;
  }
}

