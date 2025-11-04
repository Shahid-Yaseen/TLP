// Centralized API configuration
// Uses VITE_API_URL environment variable, falls back to localhost for development
// Vite automatically exposes environment variables prefixed with VITE_
// Automatically converts HTTPS to HTTP if needed (for IP-based access)
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

// If API_URL is HTTPS but we're accessing via IP, convert to HTTP
// This handles cases where the secret is set to HTTPS but server only supports HTTP
if (API_URL.startsWith('https://') && window.location.protocol === 'http:') {
  API_URL = API_URL.replace('https://', 'http://');
}

// If no explicit API_URL is set and we're in production, use relative URLs
if (!import.meta.env.VITE_API_URL && window.location.hostname !== 'localhost') {
  API_URL = ''; // Use relative URLs - same domain as frontend
}

export default API_URL;

