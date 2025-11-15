/**
 * Space Devs API Service
 * 
 * Handles all interactions with the Space Devs API (lldev.thespacedevs.com)
 */

const https = require('https');

const BASE_URL = 'https://lldev.thespacedevs.com/2.3.0';
const API_KEY = process.env.SPACE_DEVS_API_KEY || '1f7f63ed1517cdef2181117304ae4ed3a6e326f0';

/**
 * Make HTTP request to Space Devs API with timeout and retry
 */
function makeRequest(endpoint, params = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const options = {
      headers: {
        'accept': 'application/json',
        'Authorization': API_KEY
      },
      timeout: 60000 // 60 second timeout
    };

    const req = https.get(url, options, (res) => {
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
    
    return await makeRequest('/launches/', defaultParams);
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
    return await makeRequest(`/launches/${id}/`);
  } catch (error) {
    console.error(`Error fetching launch ${id} from Space Devs API:`, error.message);
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
    const defaultParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
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
  fetchPreviousLaunches
};

