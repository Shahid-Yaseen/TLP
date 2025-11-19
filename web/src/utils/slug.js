/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slugified text
 */
export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')            // Trim hyphens from start
    .replace(/-+$/, '');            // Trim hyphens from end
}

/**
 * Get slug from launch data (use existing slug or generate from name)
 * @param {Object} launch - Launch object
 * @returns {string} - The slug to use for the launch
 */
export function getLaunchSlug(launch) {
  if (!launch) return '';
  
  // Use existing slug if available
  if (launch.slug) {
    return launch.slug;
  }
  
  // Generate slug from name
  if (launch.name) {
    return generateSlug(launch.name);
  }
  
  // Fallback to ID if no name
  return launch.id?.toString() || '';
}

