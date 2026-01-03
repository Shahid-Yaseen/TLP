import { extractLandingData, getBadgeColor, shouldShowBadge } from '../utils/landingUtils';

/**
 * Recovery Badge Component
 * 
 * Displays a colored badge showing landing status and location
 * - Blue: Planned/pending landing
 * - Green: Successful landing
 * - Red: Failed landing
 * - No badge: No landing attempt
 */
const RecoveryBadge = ({ launch, className = '' }) => {
  if (!launch) return null;

  // Extract landing data from rocket - check multiple sources
  // Priority: rocket_json > rocket (parsed) > raw_data.rocket
  let rocket = launch.rocket_json;
  if (!rocket && launch.rocket) {
    // Parse rocket if it's a string
    if (typeof launch.rocket === 'string') {
      try {
        rocket = JSON.parse(launch.rocket);
      } catch (e) {
        rocket = launch.rocket;
      }
    } else {
      rocket = launch.rocket;
    }
  }
  const rawData = launch.raw_data;
  const landingData = extractLandingData(rocket, rawData);

  // Don't show badge if no landing attempt
  if (!shouldShowBadge(landingData)) {
    return null;
  }

  const badgeColor = getBadgeColor(landingData);
  if (!badgeColor) {
    return null;
  }

  // Determine icon based on landing type
  const getIcon = () => {
    const type = landingData.type?.toUpperCase();
    const location = landingData.landingLocation?.toUpperCase();
    
    // ASDS (drone ship) - show ship icon
    if (type === 'ASDS' || location === 'JRTI' || location === 'OCISLY' || location === 'ASOG') {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      );
    }
    
    // Splashdown - show parachute/water icon
    if (location === 'SPLASHDOWN') {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2A1 1 0 0113.5 9H11v1a1 1 0 01-1 1H9a1 1 0 01-1-1V9H6.5a1 1 0 01-.646-1.256L7.033 2.744A1 1 0 018 2h4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    // RTLS (land landing) - show rocket icon
    if (type === 'RTLS' || location?.startsWith('LZ-')) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84l5.25 2.5a2 2 0 01.156 1.85l-4.5 2.5a1 1 0 00-.664.664L2.08 13.394a1 1 0 00-.08.788l3 7a1 1 0 001.84 0l2.5-5.25a2 2 0 01.85-.156l4.5 2.5a1 1 0 00.664-.664l.5-2.5a2 2 0 01.156-.85l5.25-2.5a1 1 0 000-1.84l-7-3z" />
        </svg>
      );
    }
    
    // Default rocket icon
    return (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84l5.25 2.5a2 2 0 01.156 1.85l-4.5 2.5a1 1 0 00-.664.664L2.08 13.394a1 1 0 00-.08.788l3 7a1 1 0 001.84 0l2.5-5.25a2 2 0 01.85-.156l4.5 2.5a1 1 0 00.664-.664l.5-2.5a2 2 0 01.156-.85l5.25-2.5a1 1 0 000-1.84l-7-3z" />
      </svg>
    );
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${badgeColor} rounded text-white ${className}`}>
      {getIcon()}
      <span className="text-[9px] font-semibold uppercase tracking-wide">
        {landingData.landingLocation}
      </span>
    </div>
  );
};

export default RecoveryBadge;

