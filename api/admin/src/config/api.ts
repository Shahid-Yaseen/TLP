/**
 * API base URL for admin requests.
 * When the page is loaded over HTTPS, use same-origin (empty string) to avoid mixed content.
 * Otherwise use REACT_APP_API_URL or localhost for development.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '';
  }
  const env = (process.env.REACT_APP_API_URL || 'http://localhost:3007').trim();
  return env || 'http://localhost:3007';
}
