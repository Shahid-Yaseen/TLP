/**
 * Space Devs API Service
 * 
 * Handles all interactions with the Space Devs API (ll.thespacedevs.com)
 */

const https = require('https');

// Use production API with the provided key (Token format)
const BASE_URL = 'https://ll.thespacedevs.com/2.3.0';
const API_KEY = process.env.SPACE_DEVS_API_KEY || '1f7f63ed1517cdef2181117304ae4ed3a6e326f0';

/**
 * Make HTTP request to Space Devs API with timeout and retry
 */
function makeRequest(endpoint, params = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Token ${API_KEY}`
      },
      timeout: 60000 // 60 second timeout
      // Note: SSL certificate verification is handled by Node.js default CA store
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } else {
            reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.end();

    req.on('error', (error) => {
      req.destroy();
      if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET')) {
        console.log(`Request failed, retrying... (${retries} retries left)`);
        setTimeout(() => {
          makeRequest(endpoint, params, retries - 1).then(resolve).catch(reject);
        }, 2000);
      } else {
        reject(new Error(`API request error: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        console.log(`Request timed out, retrying... (${retries} retries left)`);
        setTimeout(() => {
          makeRequest(endpoint, params, retries - 1).then(resolve).catch(reject);
        }, 2000);
      } else {
        reject(new Error('API request timeout'));
      }
    });

    req.setTimeout(options.timeout);
  });
}

/**
 * Fetch launches with pagination support
 * @param {Object} params - Query parameters (limit, offset, search, etc.)
 * @returns {Promise<Object>} API response with results and pagination
 */
async function fetchLaunchers(params = {}) {
  try {
    const defaultParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Use /launch/ endpoint (try both singular and plural)
    try {
      return await makeRequest('/launch/', defaultParams);
    } catch (error) {
      // Fallback to plural if singular fails
      if (error.message.includes('404')) {
        return await makeRequest('/launches/', defaultParams);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching launches from Space Devs API:', error.message);
    throw error;
  }
}

/**
 * Fetch a single launch by ID
 * @param {string} id - Launch UUID
 * @returns {Promise<Object>} Launch data
 */
async function fetchLauncherById(id) {
  try {
    // Use /launches/{id}/ endpoint for fetching single launch by ID
    return await makeRequest(`/launches/${id}/`);
  } catch (error) {
    console.error(`Error fetching launch ${id} from Space Devs API:`, error.message);
    throw error;
  }
}

/**
 * Fetch astronauts by launch ID
 * @param {string} launchId - Launch UUID
 * @returns {Promise<Array>} Array of astronaut objects
 */
async function fetchAstronautsByLaunchId(launchId) {
  try {
    const response = await makeRequest('/astronauts/', {
      flights__launch__id: launchId
    });
    // Space Devs API returns {results: [...], count: N}
    return response.results || response || [];
  } catch (error) {
    console.error(`Error fetching astronauts for launch ${launchId} from Space Devs API:`, error.message);
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Fetch launcher configuration by URL
 * @param {string} url - Configuration URL (can be full URL or just the path)
 * @returns {Promise<Object>} Launcher configuration data
 */
async function fetchLauncherConfiguration(url) {
  try {
    // If URL is a full URL, extract the path; otherwise use as-is
    let endpoint = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Extract path from full URL
      try {
        const urlObj = new URL(url);
        endpoint = urlObj.pathname;
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        const match = url.match(/\/2\.3\.0\/.*$/);
        if (match) {
          endpoint = match[0];
        }
      }
    }
    
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Ensure endpoint ends with / for consistency
    if (!endpoint.endsWith('/')) {
      endpoint = endpoint + '/';
    }
    
    return await makeRequest(endpoint);
  } catch (error) {
    console.error(`Error fetching launcher configuration from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Fetch upcoming launches with pagination support
 * @param {Object} params - Query parameters (limit, offset, search, etc.)
 * @returns {Promise<Object>} API response with results and pagination
 */
async function fetchUpcomingLaunches(params = {}) {
  try {
    // Get current time in ISO format for filtering
    const now = new Date().toISOString();
    
    const defaultParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ordering: params.ordering || 'net', // Order by net (launch date) ascending - most recent first
      net__gte: params.net__gte || now, // Only get launches from now onwards (exclude past launches)
      ...params
    };
    
    // Use /launches/upcoming/ endpoint (plural) as per SpaceDevs API documentation
    return await makeRequest('/launches/upcoming/', defaultParams);
  } catch (error) {
    console.error('Error fetching upcoming launches from Space Devs API:', error.message);
    throw error;
  }
}

/**
 * Fetch previous launches with pagination support
 * @param {Object} params - Query parameters (limit, offset, search, etc.)
 * @returns {Promise<Object>} API response with results and pagination
 */
async function fetchPreviousLaunches(params = {}) {
  try {
    const defaultParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Use /launches/previous/ endpoint (plural) as per SpaceDevs API documentation
    return await makeRequest('/launches/previous/', defaultParams);
  } catch (error) {
    console.error('Error fetching previous launches from Space Devs API:', error.message);
    throw error;
  }
}

/**
 * Fetch all launches (handles pagination automatically)
 * @returns {Promise<Array>} Array of all launches
 */
async function fetchAllLaunchers() {
  try {
    const allLaunches = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    console.log('Starting to fetch all launches from Space Devs API...');

    while (hasMore) {
      const response = await fetchLaunchers({ limit, offset });
      
      if (response.results && Array.isArray(response.results)) {
        allLaunches.push(...response.results);
        console.log(`Fetched ${allLaunches.length} launches so far...`);
        
        // Check if there are more results
        hasMore = response.next !== null && response.results.length === limit;
        offset += limit;
        
        // Add a small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`Finished fetching ${allLaunches.length} total launches`);
    return allLaunches;
  } catch (error) {
    console.error('Error fetching all launches:', error.message);
    throw error;
  }
}

module.exports = {
  fetchLaunchers,
  fetchLauncherById,
  fetchAllLaunchers,
  fetchUpcomingLaunches,
  fetchPreviousLaunches,
  fetchAstronautsByLaunchId,
  fetchLauncherConfiguration
};

