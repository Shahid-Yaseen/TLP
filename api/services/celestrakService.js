/**
 * CelesTrak Integration Service
 * Fetches, parses, and stores satellite data from CelesTrak API
 */

const satellite = require('satellite.js');
const { getPool } = require('../config/database');

const CELESTRAK_BASE_URL = 'https://celestrak.org/NORAD/elements';
const EARTH_RADIUS_KM = 6371;

/**
 * Fetch all satellites from CelesTrak
 * Uses TLE format and converts to JSON-like structure
 */
async function fetchAllSatellites() {
  try {
    console.log('[CelesTrak] Fetching all satellites from CelesTrak...');
    // Use TLE format and parse it
    // Start with ACTIVE for testing, then switch to ALL for production
    const group = process.env.CELESTRAK_GROUP || 'ACTIVE'; // Can be set to 'ALL' for full dataset
    const url = `${CELESTRAK_BASE_URL}/gp.php?GROUP=${group}&FORMAT=TLE`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CelesTrak API error: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\r\n').join('\n').split('\n').filter(line => line.trim());
    
    // TLE format: name line, line 1 (starts with "1 "), line 2 (starts with "2 ")
    const satellites = [];
    let i = 0;
    while (i < lines.length) {
      const name = lines[i].trim();
      i++;
      
      // Find next line that starts with "1 " (TLE line 1)
      while (i < lines.length && !lines[i].trim().startsWith('1 ')) {
        i++;
      }
      
      if (i < lines.length) {
        const tleLine1 = lines[i].trim();
        i++;
        
        // Find next line that starts with "2 " (TLE line 2)
        while (i < lines.length && !lines[i].trim().startsWith('2 ')) {
          i++;
        }
        
        if (i < lines.length) {
          const tleLine2 = lines[i].trim();
          satellites.push({
            name: name,
            tle_line1: tleLine1,
            tle_line2: tleLine2
          });
          i++;
        }
      }
    }
    
    console.log(`[CelesTrak] Fetched ${satellites.length} satellites`);
    return satellites;
  } catch (error) {
    console.error('[CelesTrak] Error fetching satellites:', error);
    throw error;
  }
}

/**
 * Classify satellite type and status
 */
function classifySatellite(satelliteData) {
  const name = (satelliteData.name || '').toUpperCase();
  const objectType = satelliteData.object_type || '';
  
  let type = 'SATELLITE';
  let status = 'OTHER';
  let constellation = null;
  let country = null;
  
  // Determine object type
  if (objectType.includes('DEBRIS') || name.includes('DEB') || name.includes('DEBRIS')) {
    type = 'DEBRIS';
    status = 'DEBRIS';
  } else if (objectType.includes('ROCKET') || name.includes('R/B') || name.includes('ROCKET')) {
    type = 'ROCKET_BODY';
    status = 'DEBRIS';
  } else if (name.includes('TELESCOPE') || name.includes('HST') || name.includes('JWST')) {
    type = 'TELESCOPE';
    status = 'ACTIVE';
  } else if (name.includes('ISS') || name.includes('SPACE STATION')) {
    type = 'SATELLITE';
    status = 'ACTIVE';
  } else {
    type = 'SATELLITE';
    // Try to determine if active based on name patterns
    if (name.includes('DEFUNCT') || name.includes('DECAYED') || name.includes('RETIRED')) {
      status = 'INACTIVE';
    } else {
      status = 'ACTIVE';
    }
  }
  
  // Determine constellation
  if (name.includes('STARLINK')) {
    constellation = 'STARLINK';
  } else if (name.includes('GPS') || name.includes('NAVSTAR')) {
    constellation = 'GPS';
  } else if (name.includes('ONEWEB')) {
    constellation = 'ONEWEB';
  } else if (name.includes('GLONASS')) {
    constellation = 'GLONASS';
  } else if (name.includes('GALILEO')) {
    constellation = 'GALILEO';
  } else if (name.includes('BEIDOU')) {
    constellation = 'BEIDOU';
  }
  
  // Extract country from name (basic heuristics)
  if (name.includes('USA') || name.includes('US') || name.includes('UNITED STATES')) {
    country = 'USA';
  } else if (name.includes('CHINA') || name.includes('PRC')) {
    country = 'CHINA';
  } else if (name.includes('RUSSIA') || name.includes('RUSSIAN')) {
    country = 'RUSSIA';
  } else if (name.includes('EUROPE') || name.includes('ESA')) {
    country = 'EUROPE';
  } else if (name.includes('JAPAN') || name.includes('JAXA')) {
    country = 'JAPAN';
  } else if (name.includes('INDIA') || name.includes('ISRO')) {
    country = 'INDIA';
  }
  
  return { type, status, constellation, country };
}

/**
 * Calculate orbital parameters from TLE
 */
function calculateOrbitalParams(tleLine1, tleLine2) {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
    // Calculate position and velocity
    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);
    
    if (positionAndVelocity.position && !positionAndVelocity.error) {
      const positionEci = positionAndVelocity.position;
      const velocityEci = positionAndVelocity.velocity;
      
      // Convert ECI to geodetic coordinates
      const gmst = satellite.gstime(now);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);
      
      // Calculate altitude
      const altitude = positionGd.height;
      
      // Calculate speed
      const speed = Math.sqrt(
        velocityEci.x * velocityEci.x +
        velocityEci.y * velocityEci.y +
        velocityEci.z * velocityEci.z
      ) / 1000; // Convert m/s to km/s
      
      // Extract orbital elements from TLE
      const inclination = satrec.inclo * (180 / Math.PI); // Convert to degrees
      const eccentricity = satrec.ecco;
      const meanMotion = satrec.no; // revolutions per day
      const period = (24 * 60 * 60) / meanMotion; // seconds
      
      // Calculate apogee and perigee
      const semiMajorAxis = Math.pow(398600.4418 / (meanMotion * 2 * Math.PI / 86400) ** 2, 1/3); // km
      const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
      const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;
      
      return {
        apogee: Math.round(apogee * 100) / 100,
        perigee: Math.round(perigee * 100) / 100,
        inclination: Math.round(inclination * 100) / 100,
        period: Math.round(period),
        eccentricity: Math.round(eccentricity * 10000) / 10000,
        current_altitude: Math.round(altitude * 100) / 100,
        current_speed: Math.round(speed * 100) / 100,
        semi_major_axis: Math.round(semiMajorAxis * 100) / 100
      };
    }
  } catch (error) {
    console.error('[CelesTrak] Error calculating orbital params:', error);
  }
  
  return null;
}

/**
 * Parse satellite data from CelesTrak format
 */
function parseSatelliteData(satelliteData) {
  const tleLine1 = satelliteData.tle_line1 || satelliteData.line1;
  const tleLine2 = satelliteData.tle_line2 || satelliteData.line2;
  
  if (!tleLine1 || !tleLine2) {
    return null;
  }
  
  // Extract NORAD ID from TLE line 1
  const noradIdMatch = tleLine1.match(/^\d+\s+(\d+)/);
  if (!noradIdMatch) {
    return null;
  }
  const noradId = parseInt(noradIdMatch[1], 10);
  
  // Extract international designator from TLE line 1
  // TLE format: "1 NNNNNU NNNNNNA NNNNN.NNNNNNNN ..."
  // International designator is in positions 10-17 (after classification letter)
  // Example: "1 44714U 19074B   25337..." -> "19074B" -> "2019-074B"
  // Format in TLE: YYNNN-P (2-digit year, 3-digit launch number, piece letter)
  let internationalDesignator = null;
  if (tleLine1.length >= 18) {
    // Extract the designator part (positions 10-17, 0-indexed: 9-16)
    const desPart = tleLine1.substring(9, 17).trim();
    if (desPart && /^\d{2}\d{3}[A-Z]/.test(desPart)) {
      // Format: YYNNN-P where YY is year, NNN is launch number, P is piece
      const year = desPart.substring(0, 2);
      const number = desPart.substring(2, 5);
      const piece = desPart.length > 5 ? desPart.substring(5).trim() : '';
      
      // Convert 2-digit year to 4-digit (assuming 1957-2056 range)
      const yearNum = parseInt(year, 10);
      const fullYear = yearNum < 57 ? 2000 + yearNum : 1900 + yearNum;
      
      // Format as YYYY-NNN-P (e.g., 2019-074B)
      if (piece) {
        internationalDesignator = `${fullYear}-${number}${piece}`;
      } else {
        internationalDesignator = `${fullYear}-${number}`;
      }
    }
  }
  
  // Extract launch date from international designator (YYNNN format)
  let launchDate = null;
  if (internationalDesignator) {
    const yearMatch = internationalDesignator.match(/^(\d{2})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const fullYear = year < 57 ? 2000 + year : 1900 + year; // Assuming 1957-2056 range
      // We can't extract exact date from designator, so we'll use year-01-01 as approximation
      launchDate = `${fullYear}-01-01`;
    }
  }
  
  // Classify satellite
  const classification = classifySatellite(satelliteData);
  
  // Calculate orbital parameters
  const orbitalData = calculateOrbitalParams(tleLine1, tleLine2);
  
  return {
    norad_id: noradId,
    name: satelliteData.name || `NORAD ${noradId}`,
    international_designator: internationalDesignator,
    object_type: classification.type,
    country: classification.country,
    constellation: classification.constellation,
    tle_line1: tleLine1,
    tle_line2: tleLine2,
    orbital_data: orbitalData,
    status: classification.status,
    launch_date: launchDate,
    rocket_name: null // Not available in CelesTrak TLE data
  };
}

/**
 * Store satellites in database (batch insert/update)
 */
async function storeSatellites(satellites, batchSize = 1000) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < satellites.length; i += batchSize) {
      const batch = satellites.slice(i, i + batchSize);
      
      for (const sat of batch) {
        try {
          const result = await client.query(
            `INSERT INTO satellites_cache (
              norad_id, name, international_designator, object_type, country, 
              constellation, tle_line1, tle_line2, orbital_data, status, 
              launch_date, rocket_name, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT (norad_id) 
            DO UPDATE SET
              name = EXCLUDED.name,
              international_designator = EXCLUDED.international_designator,
              object_type = EXCLUDED.object_type,
              country = EXCLUDED.country,
              constellation = EXCLUDED.constellation,
              tle_line1 = EXCLUDED.tle_line1,
              tle_line2 = EXCLUDED.tle_line2,
              orbital_data = EXCLUDED.orbital_data,
              status = EXCLUDED.status,
              launch_date = EXCLUDED.launch_date,
              rocket_name = EXCLUDED.rocket_name,
              last_updated = NOW()`,
            [
              sat.norad_id,
              sat.name,
              sat.international_designator,
              sat.object_type,
              sat.country,
              sat.constellation,
              sat.tle_line1,
              sat.tle_line2,
              JSON.stringify(sat.orbital_data),
              sat.status,
              sat.launch_date,
              sat.rocket_name
            ]
          );
          
          if (result.rowCount === 1) {
            // Check if it was insert or update by checking if row existed
            const checkResult = await client.query(
              'SELECT created_at FROM satellites_cache WHERE norad_id = $1',
              [sat.norad_id]
            );
            if (checkResult.rows[0] && checkResult.rows[0].created_at < new Date(Date.now() - 1000)) {
              updated++;
            } else {
              inserted++;
            }
          }
        } catch (error) {
          errors++;
          if (errors <= 10) { // Log first 10 errors
            console.error(`[CelesTrak] Error storing satellite ${sat.norad_id}:`, error.message);
          }
        }
      }
      
      if ((i + batchSize) % 5000 === 0) {
        console.log(`[CelesTrak] Processed ${Math.min(i + batchSize, satellites.length)}/${satellites.length} satellites...`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`[CelesTrak] Storage complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);
    return { inserted, updated, errors };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main function to refresh cache
 */
async function refreshCache() {
  try {
    console.log('[CelesTrak] Starting cache refresh...');
    const startTime = Date.now();
    
    // Fetch all satellites
    const rawSatellites = await fetchAllSatellites();
    
    // Parse satellite data
    console.log('[CelesTrak] Parsing satellite data...');
    const parsedSatellites = [];
    for (let i = 0; i < rawSatellites.length; i++) {
      const parsed = parseSatelliteData(rawSatellites[i]);
      if (parsed) {
        parsedSatellites.push(parsed);
      }
      
      if ((i + 1) % 1000 === 0) {
        console.log(`[CelesTrak] Parsed ${i + 1}/${rawSatellites.length} satellites...`);
      }
    }
    
    console.log(`[CelesTrak] Successfully parsed ${parsedSatellites.length}/${rawSatellites.length} satellites`);
    
    // Store in database
    const result = await storeSatellites(parsedSatellites);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[CelesTrak] Cache refresh completed in ${duration}s`);
    
    return {
      success: true,
      total: rawSatellites.length,
      parsed: parsedSatellites.length,
      ...result,
      duration: `${duration}s`
    };
  } catch (error) {
    console.error('[CelesTrak] Cache refresh failed:', error);
    throw error;
  }
}

module.exports = {
  fetchAllSatellites,
  parseSatelliteData,
  classifySatellite,
  calculateOrbitalParams,
  storeSatellites,
  refreshCache
};

