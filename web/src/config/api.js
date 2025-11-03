// Centralized API configuration
// Uses VITE_API_URL environment variable, falls back to localhost for development
// Vite automatically exposes environment variables prefixed with VITE_
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

export default API_URL;

