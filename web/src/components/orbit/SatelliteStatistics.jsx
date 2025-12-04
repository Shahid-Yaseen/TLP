/**
 * Satellite Statistics Component
 * Displays counts for ACTIVE, INACTIVE, DEBRIS, OTHER
 * Matches reference image: horizontal layout with 4 categories side by side
 */

const SatelliteStatistics = ({ statistics }) => {
  const stats = statistics || {
    ACTIVE: 0,
    INACTIVE: 0,
    DEBRIS: 0,
    OTHER: 0
  };

  return (
    <div className="bg-black bg-opacity-90 p-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
      <h3 className="text-[9px] font-semibold text-gray-400 mb-2 uppercase tracking-wide text-center" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
        CURRENTLY IN ORBIT
      </h3>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {(stats.ACTIVE || 0).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            ACTIVE
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {(stats.INACTIVE || 0).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            INACTIVE
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {(stats.DEBRIS || 0).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            DEBRIS
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {(stats.OTHER || 0).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
            OTHER
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteStatistics;

