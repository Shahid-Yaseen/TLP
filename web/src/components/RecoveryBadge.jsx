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

  // Determine icon based on landing type - only show if attempt is planned
  const getIcon = () => {
    // Only show icon if recovery attempt is planned
    if (!landingData || !landingData.attempt) {
      return null;
    }

    const type = landingData.type?.toUpperCase();
    const location = landingData.landingLocation?.toUpperCase();
    
    // ASDS (drone ship) - show drone ship icon
    if (type === 'ASDS' || location === 'JRTI' || location === 'OCISLY' || location === 'ASOG') {
      return (
        <img 
          src="/RecoveryIcon/Drone Ship.png" 
          alt="Drone Ship" 
          className="w-6 h-6 object-contain"
        />
      );
    }
    
    // Splashdown - show ocean icon
    if (location === 'SPLASHDOWN') {
      return (
        <img 
          src="/RecoveryIcon/Ocean.png" 
          alt="Ocean" 
          className="w-6 h-6 object-contain"
        />
      );
    }
    
    // RTLS (land landing) - show landing zone icon
    if (type === 'RTLS' || location?.startsWith('LZ-')) {
      return (
        <img 
          src="/RecoveryIcon/Landing Zone.png" 
          alt="Landing Zone" 
          className="w-6 h-6 object-contain"
        />
      );
    }
    
    // Default: use landing zone icon
    return (
      <img 
        src="/RecoveryIcon/Landing Zone.png" 
        alt="Recovery" 
        className="w-6 h-6 object-contain"
      />
    );
  };

  const icon = getIcon();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 ${badgeColor} rounded text-white ${className}`}>
      {icon}
      <span className="text-[9px] font-semibold uppercase tracking-wide">
        {landingData.landingLocation}
      </span>
    </div>
  );
};

export default RecoveryBadge;

