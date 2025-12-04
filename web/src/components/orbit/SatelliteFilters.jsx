/**
 * Satellite Filters Component
 * Matches reference image exactly - 2-column grid layout with labels and options
 */

import { useState } from 'react';

const SatelliteFilters = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(true);

  const handleLocationChange = (location) => {
    onFilterChange({ ...filters, location: filters.location === location ? null : location });
  };

  const handleConstellationToggle = (constellation) => {
    const current = filters.constellations || [];
    const updated = current.includes(constellation)
      ? current.filter(c => c !== constellation)
      : [...current, constellation];
    onFilterChange({ ...filters, constellations: updated });
  };

  const handleTypeToggle = (type) => {
    const current = filters.types || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFilterChange({ ...filters, types: updated });
  };

  return (
    <div className="w-full bg-black bg-opacity-90 flex flex-col" style={{ fontFamily: 'Nasalization, sans-serif' }}>
      {/* Block A: Search Bar */}
      <div className="border border-gray-500 border-opacity-50 p-1.5 flex items-center gap-1.5 shrink-0" style={{ borderWidth: '1px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="SEARCH"
          className="flex-1 bg-transparent border-none outline-none text-white text-xs font-semibold uppercase placeholder-white placeholder-opacity-50"
          style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}
        />
      </div>

      {/* Block B: FILTERS Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="border border-gray-500 border-opacity-50 border-t-0 px-2 py-1.5 text-white text-xs font-semibold uppercase text-left hover:bg-white hover:bg-opacity-10 transition-colors shrink-0 w-auto"
        style={{ fontFamily: 'Nasalization, sans-serif', borderWidth: '1px', letterSpacing: '0.05em' }}
      >
        FILTERS
      </button>

      {/* Block C: Main Data Panel */}
      {showFilters && (
        <div className="border-l border-t border-b border-gray-500 border-opacity-50 relative" style={{ borderRightWidth: '4px', borderRightColor: '#FF0000', borderLeftWidth: '1px', borderTopWidth: '1px', borderBottomWidth: '1px' }}>
          <div className="p-2 space-y-2">
            {/* LOCATION - 2-column grid */}
            <div className="grid grid-cols-[115px_1fr] gap-x-2 items-start">
              <div className="text-white text-[10px] font-normal uppercase text-right leading-tight" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                LOCATION
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['EARTH', 'LEO', 'MEO', 'GEO'].map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationChange(location)}
                    className={`text-xs font-semibold uppercase transition-colors ${
                      filters.location === location
                        ? 'text-[#8B1A1A]'
                        : 'text-white text-opacity-70 hover:text-opacity-100'
                    }`}
                    style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            {/* SATELLITE CONSTELLATIONS - 2-column grid */}
            <div className="grid grid-cols-[115px_1fr] gap-x-2 items-start">
              <div className="text-white text-[10px] font-normal uppercase text-right leading-tight" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                SATELLITE CONSTELLATIONS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['STARLINK', 'GPS', 'ONEWEB'].map((constellation) => {
                  const isSelected = (filters.constellations || []).includes(constellation);
                  return (
                    <button
                      key={constellation}
                      onClick={() => handleConstellationToggle(constellation)}
                      className={`text-xs font-semibold uppercase transition-colors ${
                        isSelected
                          ? 'text-[#8B1A1A]'
                          : 'text-white text-opacity-70 hover:text-opacity-100'
                      }`}
                      style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}
                    >
                      {constellation}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TYPE - 2-column grid */}
            <div className="grid grid-cols-[115px_1fr] gap-x-2 items-start">
              <div className="text-white text-[10px] font-normal uppercase text-right leading-tight" style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}>
                TYPE
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {['SATELLITE', 'DEBRIS', 'TELESCOPE', 'LAUNCH SITE'].map((type) => {
                  const isSelected = (filters.types || []).includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={`text-xs font-semibold uppercase text-left transition-colors ${
                        isSelected
                          ? 'text-[#8B1A1A]'
                          : 'text-white text-opacity-70 hover:text-opacity-100'
                      }`}
                      style={{ fontFamily: 'Nasalization, sans-serif', letterSpacing: '0.05em' }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteFilters;

