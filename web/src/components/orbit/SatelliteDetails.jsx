/**
 * Satellite Details Component
 * Displays detailed information about selected satellite
 * Matches reference image layout exactly
 */

import { calculateCurrentStatus } from '../../utils/satelliteCalculations';

const SatelliteDetails = ({ satellite, onClose, timestamp = new Date() }) => {
  if (!satellite) {
    return (
      <div className="bg-black bg-opacity-90 border border-white border-opacity-30 p-3 text-gray-400 text-xs" style={{ fontFamily: 'Nasalization, sans-serif' }}>
        Select a satellite to view details
      </div>
    );
  }

  const orbitalData = satellite.orbital_data || {};
  const currentStatus = satellite.tle_line1 && satellite.tle_line2
    ? calculateCurrentStatus(satellite.tle_line1, satellite.tle_line2, timestamp)
    : null;

  // Format launch date as MM/DD/YY
  const formatLaunchDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${month}/${day}/${year}`;
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-black bg-opacity-90 p-3 relative" style={{ fontFamily: 'Nasalization, sans-serif' }}>
      {/* Top Header Section - All in one line */}
      <div className="pb-2 mb-3 flex items-center gap-4">
        {/* Close button (X) */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xs p-1 shrink-0"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* International Designator */}
        <div className="shrink-0">
          <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider font-semibold" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            INTL DESIGNATOR
          </div>
          <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {satellite.international_designator || 'N/A'}
          </div>
        </div>

        {/* Object Name - Large and prominent in white */}
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {satellite.name || `NORAD ${satellite.norad_id}`}
          </div>
        </div>

        {/* Country and Type - One line */}
        <div className="flex justify-end items-start gap-2 shrink-0">
          {satellite.country && (
            <div className="text-right">
              <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider font-semibold" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                COUNTRY
              </div>
              <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {satellite.country}
              </div>
            </div>
          )}
          {satellite.object_type && (
            <div className="text-right">
              <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider font-semibold" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                TYPE
              </div>
              <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {satellite.object_type}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Data Panels - Three columns */}
      <div className="grid border-t-2 border-l border-r" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr', borderTopColor: '#FF0000', borderLeftColor: '#FFFFFF', borderRightColor: '#FFFFFF', borderLeftWidth: '1px', borderRightWidth: '1px' }}>
        {/* Left Panel: ORBITAL INFORMATION */}
        <div className="pt-1 border-r flex flex-col items-center" style={{ borderRightColor: '#FFFFFF', borderRightWidth: '1px' }}>
          {/* Title */}
          <div className="text-[10px] text-white uppercase text-center font-bold tracking-wider mb-[2px]" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            ORBITAL INFORMATION
          </div>
          {/* Data points in one horizontal line */}
          <div className="flex justify-center items-start gap-[2px] mb-[2px] w-full">
            {orbitalData.apogee !== undefined && (
              <div className="flex-1 text-center">
                <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                  APOGEE
                </div>
                <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {Math.round(orbitalData.apogee)}km
                </div>
              </div>
            )}
            {orbitalData.perigee !== undefined && (
              <div className="flex-1 text-center">
                <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                  PERIGEE
                </div>
                <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {Math.round(orbitalData.perigee)}km
                </div>
              </div>
            )}
            {orbitalData.inclination !== undefined && (
              <div className="flex-1 text-center">
                <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                  INCLINATION
                </div>
                <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {orbitalData.inclination.toFixed(2)}*
                </div>
              </div>
            )}
          </div>
          {/* LAUNCHED WITH button */}
          <button className="w-auto px-2 py-1.5 bg-transparent hover:bg-white hover:bg-opacity-10 border border-white border-opacity-30 text-white text-[10px] font-bold uppercase tracking-wider transition-colors mx-auto" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            LAUNCHED WITH
          </button>
        </div>

        {/* Middle Panel: CURRENT STATUS */}
        <div className="pt-1 border-r" style={{ borderRightColor: '#FFFFFF', borderRightWidth: '1px' }}>
          {/* Title */}
          <div className="text-[10px] text-white uppercase text-center font-bold tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            CURRENT STATUS
          </div>
          {/* Data points in one horizontal line */}
          <div className="flex justify-between items-start gap-[2px]">
            {currentStatus && currentStatus.valid && currentStatus.speed !== undefined && (
              <div className="flex-1 text-center">
                <div className="text-[9px] text-gray-400 uppercase mb-0.5 tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                  CURRENT SPEED
                </div>
                <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {currentStatus.speed.toFixed(2)}km/s
                </div>
              </div>
            )}
            {currentStatus && currentStatus.valid && currentStatus.altitude !== undefined && (
              <div className="flex-1 text-center">
                <div className="text-[10px] text-white font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  <span className="text-gray-400 uppercase text-[9px] tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>CURRENT ALTITUDE: </span>
                  {currentStatus.altitude.toFixed(2)}km
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: LAUNCH DETAILS */}
        <div className="pt-1 flex flex-col items-center">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider text-center" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            LAUNCH DETAILS
          </div>
          <div className="space-y-1.5 text-xs mb-3 flex flex-col items-center">
            {satellite.launch_date && (
              <div className="text-center">
                <span className="text-gray-400">LAUNCH DATE:</span>
                <span className="text-white ml-1 font-bold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {formatLaunchDate(satellite.launch_date) || 'N/A'}
                </span>
              </div>
            )}
            {satellite.rocket_name && (
              <div className="text-center">
                <span className="text-gray-400">ROCKET:</span>
                <span className="text-white ml-1 font-bold uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  {satellite.rocket_name}
                </span>
              </div>
            )}
          </div>
          {/* MISSION BRIEFING button */}
          <button className="w-auto px-2 py-1.5 bg-transparent hover:bg-white hover:bg-opacity-10 border border-white border-opacity-30 text-white text-[10px] font-bold uppercase tracking-wider transition-colors mx-auto" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            MISSION BRIEFING
          </button>
        </div>
      </div>
    </div>
  );
};

export default SatelliteDetails;

