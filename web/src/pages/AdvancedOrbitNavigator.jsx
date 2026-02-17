/**
 * Advanced Orbit Navigator Page
 * Main component for the advanced 3D satellite visualization
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import AdvancedOrbitScene from '../components/orbit/AdvancedOrbitScene';
import SatelliteFilters from '../components/orbit/SatelliteFilters';
import SatelliteStatistics from '../components/orbit/SatelliteStatistics';
import SatelliteDetails from '../components/orbit/SatelliteDetails';
import { fetchSatellites, fetchStatistics, fetchSatellitePositions } from '../services/satelliteService';
import { filterByLocation, calculateSatellitePosition, convertECEFToSceneCoords } from '../utils/satelliteCalculations';
import RedDotLoader from '../components/common/RedDotLoader';

const AdvancedOrbitNavigator = () => {
  const [satellites, setSatellites] = useState([]);
  const [filteredSatellites, setFilteredSatellites] = useState([]);
  const [satellitePositions, setSatellitePositions] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    location: null,
    constellations: [],
    types: [],
    status: null
  });

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch satellites and statistics in parallel
      const [satellitesResponse, statisticsResponse] = await Promise.all([
        fetchSatellites({ limit: 10000 }), // Load up to 10k satellites
        fetchStatistics()
      ]);

      if (satellitesResponse.success) {
        setSatellites(satellitesResponse.data || []);
      }

      if (statisticsResponse.success) {
        setStatistics(statisticsResponse.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load satellite data');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredSatellitesList = useMemo(() => {
    let filtered = [...satellites];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(sat =>
        sat.name?.toLowerCase().includes(searchLower) ||
        sat.international_designator?.toLowerCase().includes(searchLower) ||
        sat.norad_id?.toString().includes(searchLower)
      );
    }

    // Location filter
    if (filters.location && filters.location !== 'EARTH') {
      filtered = filterByLocation(filtered, filters.location);
    }

    // Constellation filter
    if (filters.constellations && filters.constellations.length > 0) {
      filtered = filtered.filter(sat =>
        filters.constellations.includes(sat.constellation)
      );
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(sat => {
        const type = sat.object_type?.toUpperCase();
        return filters.types.some(filterType => {
          if (filterType === 'SATELLITE') return type === 'SATELLITE';
          if (filterType === 'DEBRIS') return type === 'DEBRIS' || type === 'ROCKET_BODY';
          if (filterType === 'TELESCOPE') return type === 'TELESCOPE';
          return false;
        });
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(sat => sat.status === filters.status);
    }

    return filtered;
  }, [satellites, filters]);

  // Calculate positions for filtered satellites
  useEffect(() => {
    if (filteredSatellitesList.length === 0) {
      setSatellitePositions([]);
      return;
    }

    // Limit to first 5000 for performance
    const satellitesToRender = filteredSatellitesList.slice(0, 5000);
    const now = new Date();

    const positions = satellitesToRender.map(satellite => {
      if (!satellite.tle_line1 || !satellite.tle_line2) {
        return null;
      }

      const positionData = calculateSatellitePosition(
        satellite.tle_line1,
        satellite.tle_line2,
        now
      );

      if (positionData.valid) {
        const sceneCoords = convertECEFToSceneCoords(positionData.position);
        return {
          ...satellite,
          position: sceneCoords
        };
      }

      return null;
    }).filter(Boolean);

    setSatellitePositions(positions);
  }, [filteredSatellitesList]);

  // Update filtered satellites when positions change
  useEffect(() => {
    setFilteredSatellites(satellitePositions);
  }, [satellitePositions]);

  // Handle satellite click
  const handleSatelliteClick = useCallback((satellite) => {
    setSelectedSatellite(satellite);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-black text-white relative" style={{ fontFamily: 'Nasalization, sans-serif' }}>
        <div className="relative" style={{ height: 'calc(100vh - 50px)' }}>
          {/* Title Header - Positioned below Layout header */}
          <div className="absolute top-4 left-0 right-0 z-20 text-center pointer-events-none">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>THE LAUNCH PAD</h1>
            <h2 className="text-lg text-gray-400" style={{ fontFamily: 'Nasalization, sans-serif' }}>EARTH SPACE NAVIGATOR</h2>
          </div>

          {/* 3D Scene - Full Container */}
          <div className="absolute inset-0">
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                <RedDotLoader size="large" />
              </div>
            )}

            {error && (
              <div className="absolute top-4 left-4 right-4 bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-2 rounded z-10" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {error}
              </div>
            )}

            <AdvancedOrbitScene
              satellites={filteredSatellites}
              selectedSatellite={selectedSatellite}
              onSatelliteClick={handleSatelliteClick}
              autoRotate={autoRotate}
            />

            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  autoRotate
                    ? 'bg-[#8B1A1A] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
                style={{ fontFamily: 'Nasalization, sans-serif' }}
              >
                {autoRotate ? 'AUTO ROTATE: ON' : 'AUTO ROTATE: OFF'}
              </button>
            </div>

          </div>

          {/* Left Sidebar - Filters - Positioned below Layout header */}
          <div className="absolute left-8 top-4 w-[355px] z-30">
            <SatelliteFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* CURRENTLY IN ORBIT - Left Bottom Corner */}
          <div className="absolute bottom-4 left-8 z-20">
            <SatelliteStatistics statistics={statistics} />
          </div>

          {/* Bottom Panel - Details Only */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-transparent">
            <div className="max-w-7xl mx-auto flex justify-center">
              {/* Selected Object Details */}
              <div className="w-full lg:w-auto">
                <SatelliteDetails 
                  satellite={selectedSatellite} 
                  onClose={() => setSelectedSatellite(null)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedOrbitNavigator;

