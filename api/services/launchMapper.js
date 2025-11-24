/**
 * Launch Mapper Service
 * 
 * Maps Space Devs API launcher data to our database schema
 */

/**
 * Map Space Devs API launcher object to our launch format
 * @param {Object} launcherData - Launcher data from Space Devs API
 * @returns {Object} Mapped launch data ready for database insertion
 */
function mapLauncherToLaunch(launcherData) {
  if (!launcherData) {
    console.log('[Mapper] Received null/undefined launcherData');
    return null;
  }

  console.log(`[Mapper] Mapping launch: ${launcherData.name || launcherData.id || 'Unknown'}`);
  console.log(`[Mapper] Array fields - Updates: ${launcherData.updates?.length || 0}, Timeline: ${launcherData.timeline?.length || 0}, Mission Patches: ${launcherData.mission_patches?.length || 0}, Info URLs: ${launcherData.info_urls?.length || 0}, Vid URLs: ${launcherData.vid_urls?.length || 0}`);

  const mapped = {
    // Core fields
    external_id: launcherData.id || launcherData.uuid || null,
    name: launcherData.name || null,
    slug: launcherData.slug || null,
    launch_designator: launcherData.launch_designator || null,
    
    // Dates - launches endpoint uses 'net' for launch date
    launch_date: launcherData.net || launcherData.maiden_flight || launcherData.first_flight_date || null,
    window_start: launcherData.window_start || null,
    window_end: launcherData.window_end || null,
    net_precision: launcherData.net_precision || null,
    
    // Status and outcome
    outcome: mapOutcome(launcherData),
    
    // Details
    details: launcherData.description || launcherData.details || null,
    mission_description: launcherData.mission?.description || launcherData.mission_description || null,
    
    // Media
    media: mapMedia(launcherData),
    youtube_video_id: extractYoutubeId(launcherData.video_url || launcherData.video || null),
    youtube_channel_id: launcherData.youtube_channel_id || null,
    
    // Flags
    is_featured: launcherData.featured || false,
    webcast_live: launcherData.webcast_live || false,
    
    // Additional fields (keep text versions for backward compatibility)
    probability: typeof launcherData.probability === 'number' ? launcherData.probability : (typeof launcherData.probability === 'object' ? null : launcherData.probability),
    weather_concerns: typeof launcherData.weather_concerns === 'string' ? launcherData.weather_concerns : null,
    failreason: launcherData.failreason || null,
    hashtag: typeof launcherData.hashtag === 'string' ? launcherData.hashtag : null,
    
    // Timestamps
    last_updated: launcherData.last_updated || launcherData.updated_at || new Date().toISOString(),
    
    // Related entities (will be handled separately)
    // launches endpoint uses 'launch_service_provider' for provider
    provider_data: launcherData.launch_service_provider || launcherData.manufacturer || launcherData.lsp || null,
    // rocket has nested configuration
    rocket_data: launcherData.rocket || launcherData.configuration || null,
    // mission has nested orbit
    orbit_data: launcherData.mission?.orbit || launcherData.orbit || null,
    // pad and location are separate objects
    // Location is nested inside pad object in the launches endpoint
    site_data: launcherData.pad?.location || launcherData.location || null,
    pad_data: launcherData.pad || null,
    mission_type_data: launcherData.mission?.type || launcherData.mission_type || null,
    status_data: launcherData.status || null,
    
    // URL from API
    url: launcherData.url || null,
    
    // Additional top-level fields
    response_mode: launcherData.response_mode || null,
    flightclub_url: launcherData.flightclub_url || null,
    pad_turnaround: launcherData.pad_turnaround || null,
    
    // Launch attempt counts
    orbital_launch_attempt_count: launcherData.orbital_launch_attempt_count || null,
    location_launch_attempt_count: launcherData.location_launch_attempt_count || null,
    pad_launch_attempt_count: launcherData.pad_launch_attempt_count || null,
    agency_launch_attempt_count: launcherData.agency_launch_attempt_count || null,
    orbital_launch_attempt_count_year: launcherData.orbital_launch_attempt_count_year || null,
    location_launch_attempt_count_year: launcherData.location_launch_attempt_count_year || null,
    pad_launch_attempt_count_year: launcherData.pad_launch_attempt_count_year || null,
    agency_launch_attempt_count_year: launcherData.agency_launch_attempt_count_year || null,
    
    // Array fields (will be processed separately in sync service)
    updates: launcherData.updates || [],
    info_urls: launcherData.info_urls || [],
    vid_urls: launcherData.vid_urls || [],
    timeline: launcherData.timeline || [],
    mission_patches: launcherData.mission_patches || [],
    
    // Store complete API objects as JSONB
    status_json: launcherData.status || null,
    image_json: launcherData.image || null,
    infographic_json: launcherData.infographic || null,
    weather_concerns_json: typeof launcherData.weather_concerns === 'object' ? launcherData.weather_concerns : null,
    hashtag_json: typeof launcherData.hashtag === 'object' ? launcherData.hashtag : null,
    launch_service_provider_json: launcherData.launch_service_provider || null,
    rocket_json: launcherData.rocket || null,
    mission_json: launcherData.mission || null,
    pad_json: launcherData.pad || null,
    program_json: launcherData.program || null,
    
    // Store complete raw API response for full data preservation
    raw_data: launcherData || null
  };

  return mapped;
}

/**
 * Map outcome/status from API to our format
 */
function mapOutcome(launcherData) {
  if (launcherData.status) {
    const status = launcherData.status;
    if (typeof status === 'string') {
      const lower = status.toLowerCase();
      if (lower.includes('success')) return 'success';
      if (lower.includes('failure') || lower.includes('fail')) return 'failure';
      if (lower.includes('partial')) return 'partial';
      if (lower.includes('hold') || lower.includes('tbd')) return 'TBD';
    }
    if (status.abbrev) {
      const abbrev = status.abbrev.toLowerCase();
      if (abbrev === 'success') return 'success';
      if (abbrev === 'failure' || abbrev === 'fail') return 'failure';
      if (abbrev === 'partial') return 'partial';
      if (abbrev === 'hold' || abbrev === 'tbd') return 'TBD';
    }
  }
  
  if (launcherData.outcome) {
    return launcherData.outcome.toLowerCase();
  }
  
  return 'TBD';
}

/**
 * Map media from API to our format
 */
function mapMedia(launcherData) {
  const media = {};
  
  if (launcherData.image) {
    media.image = launcherData.image;
  }
  
  if (launcherData.images && Array.isArray(launcherData.images)) {
    media.images = launcherData.images;
  }
  
  if (launcherData.video) {
    media.video = launcherData.video;
  }
  
  if (launcherData.video_url) {
    media.video_url = launcherData.video_url;
  }
  
  if (launcherData.webcast_live) {
    media.webcast_live = launcherData.webcast_live;
  }
  
  if (launcherData.presskit) {
    media.presskit = launcherData.presskit;
  }
  
  return Object.keys(media).length > 0 ? media : null;
}

/**
 * Extract YouTube video ID from URL
 */
function extractYoutubeId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Map provider/agency data
 */
function mapProvider(providerData) {
  if (!providerData) return null;
  
  return {
    name: providerData.name || null,
    abbrev: providerData.abbrev || providerData.abbreviation || null,
    url: providerData.url || providerData.info_url || null,
    type: providerData.type || null,
    country: providerData.country || null
  };
}

/**
 * Map rocket data
 */
function mapRocket(rocketData) {
  if (!rocketData) return null;
  
  // Handle nested configuration structure from launches endpoint
  const config = rocketData.configuration || rocketData;
  const families = config.families || [];
  const familyName = families.length > 0 ? families[0].name : (config.family || config.family_name || null);
  
  return {
    name: config.name || rocketData.name || rocketData.full_name || null,
    family: familyName,
    variant: config.variant || rocketData.variant || null,
    configuration: config.name || rocketData.configuration || null,
    manufacturer: config.manufacturer || rocketData.manufacturer || null
  };
}

/**
 * Map orbit data
 */
function mapOrbit(orbitData) {
  if (!orbitData) return null;
  
  return {
    code: orbitData.abbrev || orbitData.code || null,
    name: orbitData.name || null,
    description: orbitData.description || null
  };
}

/**
 * Map launch site data
 */
function mapLaunchSite(siteData) {
  if (!siteData) return null;
  
  // Extract country data - can be an object with name, alpha_2_code, alpha_3_code
  // or a string/code
  let countryName = null;
  let countryCode = null;
  
  if (siteData.country) {
    if (typeof siteData.country === 'object') {
      countryName = siteData.country.name || null;
      countryCode = siteData.country.alpha_2_code || siteData.country.alpha_3_code || null;
    } else {
      countryName = siteData.country;
      countryCode = siteData.country_code || null;
    }
  } else if (siteData.country_code) {
    countryCode = siteData.country_code;
  }
  
  return {
    name: siteData.name || null,
    country: countryName,
    country_code: countryCode || countryName, // For country lookup
    latitude: siteData.latitude || null,
    longitude: siteData.longitude || null,
    timezone: siteData.timezone || siteData.timezone_name || null
  };
}

/**
 * Map launch pad data
 */
function mapLaunchPad(padData) {
  if (!padData) return null;
  
  return {
    name: padData.name || null,
    latitude: padData.latitude || null,
    longitude: padData.longitude || null,
    description: padData.description || null,
    active: padData.active !== undefined ? padData.active : true
  };
}

module.exports = {
  mapLauncherToLaunch,
  mapProvider,
  mapRocket,
  mapOrbit,
  mapLaunchSite,
  mapLaunchPad
};

