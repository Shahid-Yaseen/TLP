/**
 * Satellite Calculation Utilities
 * Functions for calculating satellite positions and filtering
 */

import * as satellite from 'satellite.js';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate satellite position from TLE at given timestamp
 * Returns ECEF coordinates
 */
export function calculateSatellitePosition(tleLine1, tleLine2, timestamp = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, timestamp);

    if (positionAndVelocity.position && !positionAndVelocity.error) {
      return {
        position: positionAndVelocity.position,
        velocity: positionAndVelocity.velocity,
        valid: true
      };
    }
  } catch (error) {
    console.error('Error calculating satellite position:', error);
  }

  return { valid: false };
}

/**
 * Convert ECEF coordinates to Three.js scene coordinates
 * Scale: 1 unit = 1000 km
 */
export function convertECEFToSceneCoords(ecefPosition) {
  if (!ecefPosition) return null;

  return {
    x: ecefPosition.x / 1000,
    y: ecefPosition.y / 1000,
    z: ecefPosition.z / 1000
  };
}

/**
 * Get satellite color based on type and status
 */
export function getSatelliteColor(satellite) {
  if (!satellite) return '#808080'; // Gray default

  // Selected satellites (handled separately in component)
  if (satellite.selected) return '#4A90E2'; // Blue

  // Color by status/type
  const status = satellite.status?.toUpperCase();
  const type = satellite.object_type?.toUpperCase();

  if (status === 'DEBRIS' || type === 'DEBRIS' || type === 'ROCKET_BODY') {
    return '#FF4444'; // Red for debris
  } else if (status === 'ACTIVE') {
    return '#44FF44'; // Green for active
  } else if (status === 'INACTIVE') {
    return '#888888'; // Dark gray for inactive
  }

  return '#808080'; // Gray default
}

/**
 * Filter satellites by location (LEO, MEO, GEO)
 */
export function filterByLocation(satellites, location) {
  if (!location || location === 'EARTH') return satellites;

  return satellites.filter(sat => {
    if (!sat.orbital_data) return false;

    const perigee = sat.orbital_data.perigee;
    if (typeof perigee !== 'number') return false;

    const locationUpper = location.toUpperCase();
    
    if (locationUpper === 'LEO') {
      return perigee < 2000; // Below 2000 km
    } else if (locationUpper === 'MEO') {
      return perigee >= 2000 && perigee < 35786; // 2000-35786 km
    } else if (locationUpper === 'GEO') {
      return perigee >= 35786; // Above 35786 km
    }

    return true;
  });
}

/**
 * Calculate current speed and altitude for a satellite
 */
export function calculateCurrentStatus(tleLine1, tleLine2, timestamp = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, timestamp);

    if (positionAndVelocity.position && !positionAndVelocity.error) {
      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity;
      const gmst = satellite.gstime(timestamp);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      const altitude = positionGd.height;
      const speed = Math.sqrt(
        velocityEci.x * velocityEci.x +
        velocityEci.y * velocityEci.y +
        velocityEci.z * velocityEci.z
      ) / 1000; // Convert m/s to km/s

      return {
        altitude: Math.round(altitude * 100) / 100,
        speed: Math.round(speed * 100) / 100,
        valid: true
      };
    }
  } catch (error) {
    console.error('Error calculating current status:', error);
  }

  return { valid: false };
}

