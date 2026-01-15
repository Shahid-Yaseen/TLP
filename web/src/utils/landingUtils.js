/**
 * Landing Data Utility Functions
 * 
 * Extracts and normalizes landing data from rocket structure
 * Handles various data formats from Space Devs API
 */

/**
 * Safely parse JSONB or string data
 */
const parseJsonb = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Extract landing data from rocket structure
 * 
 * @param {Object} rocket - Rocket object (can be string, object, or JSONB)
 * @param {Object} rawData - Optional raw_data object from launch (contains full API response)
 * @returns {Object|null} Landing data object with { attempt, success, landingLocation, type, description }
 */
export const extractLandingData = (rocket, rawData = null) => {
  if (!rocket && !rawData) return null;

  // Handle string or JSONB rocket data
  let rocketData = rocket;
  if (typeof rocket === 'string') {
    rocketData = parseJsonb(rocket);
    if (!rocketData) rocketData = null;
  }

  // Try to get launcher_stage from different possible locations
  let launcherStage = null;
  
  // Priority 1: Check rocket.launcher_stage (from rocket_json)
  if (rocketData?.launcher_stage && Array.isArray(rocketData.launcher_stage) && rocketData.launcher_stage.length > 0) {
    launcherStage = rocketData.launcher_stage[0];
  }
  // Priority 2: Check rocket.configuration.launcher_stage
  else if (rocketData?.configuration?.launcher_stage && Array.isArray(rocketData.configuration.launcher_stage) && rocketData.configuration.launcher_stage.length > 0) {
    launcherStage = rocketData.configuration.launcher_stage[0];
  }
  // Priority 3: Check raw_data.rocket.launcher_stage (full API response)
  else if (rawData?.rocket?.launcher_stage && Array.isArray(rawData.rocket.launcher_stage) && rawData.rocket.launcher_stage.length > 0) {
    launcherStage = rawData.rocket.launcher_stage[0];
  }
  // Priority 4: Check raw_data.rocket.configuration.launcher_stage
  else if (rawData?.rocket?.configuration?.launcher_stage && Array.isArray(rawData.rocket.configuration.launcher_stage) && rawData.rocket.configuration.launcher_stage.length > 0) {
    launcherStage = rawData.rocket.configuration.launcher_stage[0];
  }

  // Check if landing exists and is not null
  if (!launcherStage || !launcherStage.landing || launcherStage.landing === null) {
    return null;
  }

  const landing = launcherStage.landing;
  
  // Additional check: landing must have attempt field
  if (landing.attempt !== true) {
    return null;
  }

  // Extract landing location abbreviation
  let landingLocation = null;
  if (landing.landing_location?.abbrev) {
    landingLocation = landing.landing_location.abbrev.toUpperCase();
  } else if (landing.landing_location?.name) {
    // Fallback to name and convert to common abbreviations
    const name = landing.landing_location.name.toUpperCase();
    if (name.includes('JUST READ THE INSTRUCTIONS')) landingLocation = 'JRTI';
    else if (name.includes('A SHORTFALL OF GRAVITAS')) landingLocation = 'ASOG';
    else if (name.includes('OCISLY') || name.includes('OF COURSE I STILL LOVE YOU')) landingLocation = 'OCISLY';
    else if (name.includes('LZ-')) landingLocation = name.match(/LZ-[0-9]+/)?.[0] || name;
    else landingLocation = name;
  }

  // Check for splashdown in description (when success is false)
  const description = landing.description || '';
  const isSplashdown = description.toLowerCase().includes('splashdown') && landing.success === false;

  return {
    attempt: landing.attempt === true,
    success: landing.success,
    landingLocation: isSplashdown ? 'SPLASHDOWN' : landingLocation,
    type: landing.type?.abbrev || null,
    description: description
  };
};

/**
 * Get badge color based on landing status
 * 
 * @param {Object} landingData - Landing data from extractLandingData
 * @returns {string|null} Tailwind color class or null if no badge should be shown
 */
export const getBadgeColor = (landingData) => {
  if (!landingData || !landingData.attempt) {
    return null; // No badge
  }

  if (landingData.success === true) {
    return 'bg-green-500'; // Successful landing - Green
  } else if (landingData.success === false) {
    return 'bg-red-500'; // Failed landing - Red
  } else if (landingData.success === null || landingData.success === undefined) {
    return 'bg-gray-500'; // Unknown/Planned - Grey
  }

  return null;
};

/**
 * Check if badge should be displayed
 * 
 * @param {Object} landingData - Landing data from extractLandingData
 * @returns {boolean} True if badge should be shown
 */
export const shouldShowBadge = (landingData) => {
  if (!landingData || !landingData.attempt) {
    return false;
  }
  
  // Don't show badge if landing location is missing, null, or "N/A"
  const location = landingData.landingLocation;
  if (!location || location === 'N/A' || location === 'null' || location === 'undefined') {
    return false;
  }
  
  return true;
};

