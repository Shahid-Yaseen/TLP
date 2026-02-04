// Centralized API configuration
// Uses VITE_API_URL environment variable, falls back to localhost for development
const envUrl = import.meta.env.VITE_API_URL;
let API_URL = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : 'http://localhost:3007';

// When the page is loaded over HTTPS, always use same-origin to avoid mixed content blocking.
// Browsers block HTTP requests from HTTPS pages (mixed content).
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  API_URL = '';
}
// If built with no API URL and not localhost, use same-origin
else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (!envUrl || envUrl.trim() === '')) {
  API_URL = '';
}
// If env is HTTPS but page is HTTP (e.g. dev via IP), use HTTP for API
else if (typeof window !== 'undefined' && API_URL.startsWith('https://') && window.location.protocol === 'http:') {
  API_URL = API_URL.replace('https://', 'http://');
}

export default API_URL;

