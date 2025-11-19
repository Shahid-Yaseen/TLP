import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import OrbitSceneDirect from '../components/orbit/OrbitSceneDirect';
import API_URL from '../config/api';
import RedDotLoader from '../components/common/RedDotLoader';
import { 
  getOrbitPathForType, 
  groupLaunchesByOrbit, 
  ORBIT_TYPES,
  getOrbitName,
  getOrbitColor
} from '../utils/orbitCalculations';

const EarthOrbitNavigator = () => {
  const [launches, setLaunches] = useState([]);
  const [selectedOrbits, setSelectedOrbits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(false);

  // Fetch launches data
  useEffect(() => {
    fetchLaunches();
  }, []);

  const fetchLaunches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/launches?limit=1000`, {
        timeout: 30000
      });
      
      const launchesData = response.data?.data || response.data || [];
      setLaunches(Array.isArray(launchesData) ? launchesData : []);
    } catch (err) {
      console.error('Error fetching launches:', err);
      setError('Failed to load launch data. Showing demo orbits.');
      // Continue with empty launches for demo mode
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  // Group launches by orbit and create orbit paths
  const orbitData = useMemo(() => {
    if (launches.length === 0) {
      // Demo mode: show common orbit types
      const demoOrbits = {};
      Object.keys(ORBIT_TYPES).forEach(orbitCode => {
        demoOrbits[orbitCode] = {
          orbitCode,
          orbitName: ORBIT_TYPES[orbitCode].name,
          color: ORBIT_TYPES[orbitCode].color,
          launches: [],
          points: getOrbitPathForType(orbitCode)
        };
      });
      return demoOrbits;
    }

    const grouped = groupLaunchesByOrbit(launches);
    const orbitPaths = {};
    
    Object.entries(grouped).forEach(([orbitCode, data]) => {
      orbitPaths[orbitCode] = {
        ...data,
        points: getOrbitPathForType(orbitCode)
      };
    });

    // Add common orbit types that might not have launches
    Object.keys(ORBIT_TYPES).forEach(orbitCode => {
      if (!orbitPaths[orbitCode]) {
        orbitPaths[orbitCode] = {
          orbitCode,
          orbitName: ORBIT_TYPES[orbitCode].name,
          color: ORBIT_TYPES[orbitCode].color,
          launches: [],
          points: getOrbitPathForType(orbitCode)
        };
      }
    });

    return orbitPaths;
  }, [launches]);

  // Get all available orbit codes
  const availableOrbits = useMemo(() => {
    return Object.keys(orbitData).sort();
  }, [orbitData]);

  // Toggle orbit selection
  const toggleOrbit = (orbitCode) => {
    setSelectedOrbits(prev => {
      if (prev.includes(orbitCode)) {
        return prev.filter(code => code !== orbitCode);
      } else {
        return [...prev, orbitCode];
      }
    });
  };

  // Select all orbits
  const selectAllOrbits = () => {
    setSelectedOrbits(availableOrbits);
  };

  // Deselect all orbits
  const deselectAllOrbits = () => {
    setSelectedOrbits([]);
  };

  // Get statistics
  const stats = useMemo(() => {
    const totalLaunches = launches.length;
    const orbitsWithLaunches = Object.values(orbitData).filter(
      orbit => orbit.launches.length > 0
    ).length;
    
    const launchesByOrbit = Object.values(orbitData)
      .map(orbit => ({
        orbitCode: orbit.orbitCode,
        orbitName: orbit.orbitName,
        count: orbit.launches.length
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      totalLaunches,
      orbitsWithLaunches,
      launchesByOrbit
    };
  }, [launches, orbitData]);

  // Earth texture URL (using a reliable Earth texture source)
  // Fallback to a simple blue color if texture fails to load
  const earthTextureUrl = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="flex flex-col lg:flex-row h-screen relative">
          {/* 3D Canvas */}
          <div className="flex-1 relative w-full h-full min-h-[50vh] lg:min-h-0">
            <OrbitSceneDirect
              selectedOrbits={selectedOrbits}
              orbitPaths={orbitData}
              earthTextureUrl={earthTextureUrl}
              showStars={true}
            />
            
            {/* Mobile Control Panel Toggle Button */}
            <button
              onClick={() => setShowControlPanel(!showControlPanel)}
              className="lg:hidden absolute top-4 right-4 z-20 bg-gray-900 bg-opacity-90 hover:bg-opacity-100 border border-gray-700 text-white p-3 rounded-lg transition-all"
              aria-label="Toggle control panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showControlPanel ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                <RedDotLoader size="large" />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="absolute top-4 left-4 right-4 lg:right-auto bg-yellow-900 border border-yellow-700 text-yellow-200 px-3 py-2 sm:px-4 rounded z-10 max-w-md text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Controls Info - Hidden on mobile, shown on desktop */}
            <div className="hidden md:block absolute bottom-4 left-4 bg-gray-900 bg-opacity-80 px-3 py-2 rounded text-xs text-gray-400 z-10 max-w-xs">
              <p className="hidden lg:inline">🖱️ Left Click + Drag: Rotate | Scroll: Zoom | Right Click + Drag: Pan</p>
              <p className="lg:hidden">Touch + Drag: Rotate | Pinch: Zoom</p>
            </div>
          </div>

          {/* Control Panel */}
          <div className={`${
            showControlPanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto w-full sm:w-80 lg:w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out`}>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between lg:block">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">EARTH ORBIT NAVIGATOR</h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Explore Earth's orbital paths and launch data
                  </p>
                </div>
                {/* Close button for mobile */}
                <button
                  onClick={() => setShowControlPanel(false)}
                  className="lg:hidden ml-4 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close panel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold">Auto Rotate</label>
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-colors ${
                      autoRotate
                        ? 'bg-[#8B1A1A] text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {autoRotate ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold">Show Statistics</label>
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-colors ${
                      showStats
                        ? 'bg-[#8B1A1A] text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {showStats ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={selectAllOrbits}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-xs sm:text-sm font-semibold rounded transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllOrbits}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-xs sm:text-sm font-semibold rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Orbit Selection */}
              <div>
                <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">ORBIT TYPES</h2>
                <div className="space-y-1.5 sm:space-y-2">
                  {availableOrbits.map(orbitCode => {
                    const orbit = orbitData[orbitCode];
                    const isSelected = selectedOrbits.length === 0 || selectedOrbits.includes(orbitCode);
                    const launchCount = orbit.launches.length;

                    return (
                      <button
                        key={orbitCode}
                        onClick={() => toggleOrbit(orbitCode)}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded border transition-colors ${
                          isSelected
                            ? 'bg-gray-800 border-[#8B1A1A]'
                            : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                              style={{ backgroundColor: orbit.color }}
                            />
                            <span className="font-semibold text-xs sm:text-sm">{orbit.orbitName}</span>
                          </div>
                          {launchCount > 0 && (
                            <span className="text-xs text-gray-400 shrink-0 ml-2">({launchCount})</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{orbitCode}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Statistics */}
              {showStats && (
                <div>
                  <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">STATISTICS</h2>
                  <div className="bg-gray-800 p-3 sm:p-4 rounded space-y-2 sm:space-y-3">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-[#8B1A1A]">
                        {stats.totalLaunches}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">Total Launches</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {stats.orbitsWithLaunches}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">Orbit Types with Launches</div>
                    </div>
                    
                    {stats.launchesByOrbit.length > 0 && (
                      <div className="pt-2 sm:pt-3 border-t border-gray-700">
                        <div className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Launches by Orbit:</div>
                        <div className="space-y-1">
                          {stats.launchesByOrbit.slice(0, 5).map(item => (
                            <div key={item.orbitCode} className="flex justify-between text-xs">
                              <span className="text-gray-400 truncate pr-2">{item.orbitName}</span>
                              <span className="font-semibold shrink-0">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="pt-3 sm:pt-4 border-t border-gray-800">
                <h3 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">ABOUT</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  This 3D navigator displays Earth's orbital paths based on real launch data.
                  Select orbit types to filter the visualization. All distances are scaled for
                  visualization purposes.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mobile overlay to close panel */}
          {showControlPanel && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setShowControlPanel(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EarthOrbitNavigator;

