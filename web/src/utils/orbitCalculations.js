/**
 * Orbit Calculation Utilities
 * Functions for calculating 3D orbit paths and positions
 */

// Earth radius in kilometers
export const EARTH_RADIUS_KM = 6371;

// Orbit type definitions with typical altitude ranges
export const ORBIT_TYPES = {
  LEO: {
    name: 'Low Earth Orbit',
    code: 'LEO',
    minAltitude: 200,
    maxAltitude: 2000,
    color: '#00ff00', // Green
    description: '200-2000 km altitude, used for satellites, ISS, etc.'
  },
  MEO: {
    name: 'Medium Earth Orbit',
    code: 'MEO',
    minAltitude: 2000,
    maxAltitude: 35786,
    color: '#ffff00', // Yellow
    description: '2000-35786 km altitude, used for navigation satellites'
  },
  GEO: {
    name: 'Geostationary Orbit',
    code: 'GEO',
    minAltitude: 35786,
    maxAltitude: 35786,
    color: '#ff00ff', // Magenta
    description: '35786 km altitude, synchronous with Earth rotation'
  },
  SSO: {
    name: 'Sun-Synchronous Orbit',
    code: 'SSO',
    minAltitude: 600,
    maxAltitude: 800,
    color: '#00ffff', // Cyan
    description: '600-800 km altitude, maintains constant sun angle'
  },
  HEO: {
    name: 'High Earth Orbit',
    code: 'HEO',
    minAltitude: 35786,
    maxAltitude: 50000,
    color: '#ff8800', // Orange
    description: 'Above GEO, used for specialized missions'
  },
  POLAR: {
    name: 'Polar Orbit',
    code: 'POLAR',
    minAltitude: 200,
    maxAltitude: 2000,
    color: '#0088ff', // Blue
    description: 'Polar orbit, passes over poles'
  }
};

/**
 * Calculate orbit path points for visualization
 * @param {number} semiMajorAxis - Semi-major axis in km
 * @param {number} eccentricity - Eccentricity (0-1)
 * @param {number} inclination - Inclination in degrees
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of {x, y, z} coordinates
 */
export function calculateOrbitPath(semiMajorAxis, eccentricity = 0, inclination = 0, numPoints = 100) {
  const points = [];
  const inclinationRad = (inclination * Math.PI) / 180;
  
  // Convert km to scaled units (1 unit = 1000 km for visualization)
  const scaledRadius = semiMajorAxis / 1000;
  const scaledEarthRadius = EARTH_RADIUS_KM / 1000;
  
  // Semi-minor axis for elliptical orbits
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
  const scaledSemiMinor = semiMinorAxis / 1000;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    
    // Calculate position in orbital plane
    const xOrbital = scaledRadius * Math.cos(angle);
    const yOrbital = scaledSemiMinor * Math.sin(angle);
    const zOrbital = 0;
    
    // Rotate by inclination around x-axis
    const x = xOrbital;
    const y = yOrbital * Math.cos(inclinationRad) - zOrbital * Math.sin(inclinationRad);
    const z = yOrbital * Math.sin(inclinationRad) + zOrbital * Math.cos(inclinationRad);
    
    points.push({ x, y, z });
  }
  
  return points;
}

/**
 * Get orbit path for a specific orbit type
 * @param {string} orbitCode - Orbit code (LEO, GEO, etc.)
 * @param {number} inclination - Inclination in degrees (default based on orbit type)
 * @returns {Array} Array of orbit path points
 */
export function getOrbitPathForType(orbitCode, inclination = 0) {
  const orbitType = ORBIT_TYPES[orbitCode.toUpperCase()];
  if (!orbitType) {
    // Default to LEO if unknown
    return calculateOrbitPath(EARTH_RADIUS_KM + 500, 0, inclination || 0);
  }
  
  // Use average altitude for the orbit type
  const avgAltitude = (orbitType.minAltitude + orbitType.maxAltitude) / 2;
  const semiMajorAxis = EARTH_RADIUS_KM + avgAltitude;
  
  // Set default inclination based on orbit type
  let defaultInclination = inclination;
  if (!inclination) {
    if (orbitCode === 'SSO' || orbitCode === 'POLAR') {
      defaultInclination = 98; // Near-polar
    } else if (orbitCode === 'GEO') {
      defaultInclination = 0; // Equatorial
    } else {
      defaultInclination = 51.6; // Common ISS inclination
    }
  }
  
  return calculateOrbitPath(semiMajorAxis, 0, defaultInclination);
}

/**
 * Get orbit color for a specific orbit type
 * @param {string} orbitCode - Orbit code
 * @returns {string} Hex color code
 */
export function getOrbitColor(orbitCode) {
  const orbitType = ORBIT_TYPES[orbitCode?.toUpperCase()];
  return orbitType?.color || '#ffffff';
}

/**
 * Get orbit name for a specific orbit code
 * @param {string} orbitCode - Orbit code
 * @returns {string} Orbit name
 */
export function getOrbitName(orbitCode) {
  const orbitType = ORBIT_TYPES[orbitCode?.toUpperCase()];
  return orbitType?.name || orbitCode || 'Unknown Orbit';
}

/**
 * Group launches by orbit type
 * @param {Array} launches - Array of launch objects
 * @returns {Object} Object with orbit codes as keys and launch arrays as values
 */
export function groupLaunchesByOrbit(launches) {
  const grouped = {};
  
  launches.forEach(launch => {
    const orbitCode = launch.orbit || launch.orbit_code || 'UNKNOWN';
    const key = orbitCode.toUpperCase();
    
    if (!grouped[key]) {
      grouped[key] = {
        orbitCode: key,
        orbitName: getOrbitName(key),
        color: getOrbitColor(key),
        launches: []
      };
    }
    
    grouped[key].launches.push(launch);
  });
  
  return grouped;
}

