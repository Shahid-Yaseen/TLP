import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import LaunchFilters from '../components/LaunchFilters';
import { buildLaunchFilters } from '../utils/filters';
import { getLaunchSlug } from '../utils/slug';
import RedDotLoader from '../components/common/RedDotLoader';

// Use this exact image for 100% match
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

function LaunchCenter() {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('UPCOMING');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideTBD, setHideTBD] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0 });
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Reset pagination and clear launches when tab or filters change
    const resetPagination = { total: 0, limit: 100, offset: 0, has_more: false };
    setPagination(resetPagination);
    setLaunches([]);
    // Fetch with reset pagination
    fetchLaunchesWithPagination(resetPagination);
  }, [selectedTab, filters, regionFilter, searchQuery, hideTBD]);


  const startCountdown = (targetDate) => {
    // Calculate initial countdown immediately
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return false; // Stop the interval
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
        return true; // Continue the interval
      }
    };

    // Set initial countdown
    calculateCountdown();

    // Update every second
    const interval = setInterval(() => {
      if (!calculateCountdown()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const fetchLaunches = async () => {
    return fetchLaunchesWithPagination(pagination);
  };

  const fetchLaunchesWithPagination = async (paginationToUse = pagination) => {
    try {
      setLoading(true);
      
      // Build filter params
      const filterParams = buildLaunchFilters({
        ...filters,
        limit: paginationToUse.limit || 100,
        offset: paginationToUse.offset || 0,
      });

      // Add tab-based date filter - ensure proper filtering
      const now = new Date().toISOString();
      if (selectedTab === 'UPCOMING') {
        // Only show launches with launch_date >= now
        filterParams.net__gte = now;
        // Remove any previous filter if it exists
        delete filterParams.net__lt;
      } else if (selectedTab === 'PREVIOUS') {
        // Only show launches with launch_date < now
        filterParams.net__lt = now;
        // Remove any upcoming filter if it exists
        delete filterParams.net__gte;
      }

      // Add search query
      if (searchQuery) {
        filterParams.name = searchQuery;
      }

      // Add region filter (map to country codes/names)
      if (regionFilter !== 'ALL') {
        const regionCountryMap = {
          AMERICA: { code: 'US', name: 'United States' },
          CANADA: { code: 'CA', name: 'Canada' },
          EUROPE: { code: null, name: null }, // Europe has multiple countries, handle separately
          RUSSIA: { code: 'RU', name: 'Russia' },
          CHINA: { code: 'CN', name: 'China' },
          INDIA: { code: 'IN', name: 'India' },
          'DOWN UNDER': { code: 'AU', name: 'Australia' },
          OTHER: { code: null, name: null },
        };
        
        const countryInfo = regionCountryMap[regionFilter];
        if (countryInfo) {
          if (countryInfo.code) {
            // Use country code for precise filtering
            filterParams.country__code = countryInfo.code;
          } else if (countryInfo.name) {
            // Use country name as fallback
            filterParams.country__name = countryInfo.name;
          } else if (regionFilter === 'EUROPE') {
            // Europe: filter by multiple European country codes
            // Common European space-faring countries
            filterParams.country__code = 'FR,DE,IT,ES,GB,SE,NO'; // France, Germany, Italy, Spain, UK, Sweden, Norway
          }
        }
      }

      // Hide TBD filter
      if (hideTBD) {
        filterParams.outcome = 'success,failure,partial';
      }

      const response = await axios.get(`${API_URL}/api/launches`, { params: filterParams });
      
      // Handle response format: { data: [...], pagination: {...} }
      const launchesData = response.data?.data || response.data || [];
      
      if (Array.isArray(launchesData)) {
        const sorted = launchesData.sort((a, b) =>
          new Date(b.launch_date || 0).getTime() - new Date(a.launch_date || 0).getTime()
        );
        setLaunches(sorted);
      } else {
        console.warn('Unexpected launches data format:', launchesData);
        setLaunches([]);
      }
      
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching launches:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLaunches([]); // Set empty array on error
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, offset: 0 });
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchQuery('');
    setRegionFilter('ALL');
    setHideTBD(false);
    setPagination({ ...pagination, offset: 0 });
  };

  const getEventTags = (launch) => {
    const tags = [];
    if (launch.outcome === 'success') {
      const landingTags = ['JRTI', 'OCISLY', 'ASDG SPLASHDOWN', 'TOUCHDOWN', 'SPLASHDOWN'];
      tags.push(landingTags[Math.floor(Math.random() * landingTags.length)]);
    }
    if (launch.orbit) tags.push(launch.orbit);
    return tags;
  };

  const groupLaunchesByMonth = (launches) => {
    const groups = {};
    launches.forEach(launch => {
      const date = new Date(launch.launch_date);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(launch);
    });
    return groups;
  };

  // Helper function to extract launch image URL
  const getLaunchImageUrl = (launch) => {
    if (!launch) return HERO_BG_IMAGE;
    if (launch.media?.image?.image_url) {
      return launch.media.image.image_url;
    }
    if (launch.mission_image_url) {
      return launch.mission_image_url;
    }
    if (launch.infographic_url) {
      return launch.infographic_url;
    }
    return HERO_BG_IMAGE; // Fallback to default
  };

  const allUpcoming = launches
    .filter(l => new Date(l.launch_date || 0) > new Date())
    .sort((a, b) => new Date(a.launch_date || 0).getTime() - new Date(b.launch_date || 0).getTime());
  const starlink69420 = allUpcoming.find(l => l.name?.includes('69-420'));
  const upcomingLaunch = starlink69420 || allUpcoming[0];
  
  const allPrevious = launches
    .filter(l => new Date(l.launch_date || 0) < new Date())
    .sort((a, b) => new Date(b.launch_date || 0).getTime() - new Date(a.launch_date || 0).getTime());
  const previousLaunch = allPrevious && allPrevious.length > 0 ? allPrevious[0] : null;
  
  const historicalLaunches = launches
    .filter(l => new Date(l.launch_date || 0) < new Date())
    .slice(0, 5);
  
  // Ensure we always have 5 cards for display
  const displayHistoricalLaunches = historicalLaunches.length >= 5 
    ? historicalLaunches 
    : [...historicalLaunches, ...launches.slice(0, 5 - historicalLaunches.length)];

  // Start countdown when upcoming launch is available
  useEffect(() => {
    if (selectedTab === 'UPCOMING' && upcomingLaunch?.launch_date) {
      const launchDate = upcomingLaunch.launch_date || upcomingLaunch.net;
      if (launchDate) {
        const cleanup = startCountdown(launchDate);
        return cleanup;
      }
    } else {
      // Reset countdown if not on upcoming tab or no launch
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  }, [selectedTab, upcomingLaunch, launches]);

  if (loading && launches.length === 0) {
    return <RedDotLoader fullScreen={true} size="large" />;
  }

  const launchesByMonth = groupLaunchesByMonth(launches);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Header Bar */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-full mx-auto px-6 py-2 flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>TLP Network Inc.</span>
            <span>|</span>
            <span>LAUNCH CENTER</span>
            <span>|</span>
            <span>TLP SPACE NEWS</span>
            <span>|</span>
            <Link to="/mission" className="hover:text-white transition-colors">TLP MISSION</Link>
            <span>|</span>
            <span>SPACEBASE</span>
            <span>|</span>
            <span>SHOP</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ABOUT US</span>
            <span>|</span>
            <span>SUPPORT</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#8B1A1A] border-t-2 border-white">
        <div className="max-w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="relative" style={{ overflow: 'visible' }}>
                <div className="w-14 h-14 bg-black flex items-center justify-center overflow-hidden">
                  <img 
                    src="/TLP Helmet.png" 
                    alt="TLP Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="absolute top-full left-0  bg-[#8B1A1A] px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
                  {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '')}
                </div>
              </div>
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-0 text-xs uppercase">
              <button
                onClick={() => setSelectedTab('UPCOMING')}
                className={`px-3 py-2 ${selectedTab === 'UPCOMING' ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                UPCOMING
              </button>
              <span className="mx-1 font-bold text-white">|</span>
              <button
                onClick={() => setSelectedTab('PREVIOUS')}
                className={`px-3 py-2 ${selectedTab === 'PREVIOUS' ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                PREVIOUS
              </button>
              <span className="mx-1 font-bold text-white">|</span>
              <button className="px-3 py-2 text-gray-400">EVENTS</button>
              <span className="mx-1 font-bold text-white">|</span>
              <button className="px-3 py-2 text-gray-400">STATISTICS</button>
            </div>
          </div>

          <button className="px-5 py-2 bg-white text-black hover:bg-gray-100 transition uppercase text-xs font-semibold">
            Watch On Youtube
          </button>
        </div>
      </div>

      {/* HERO SECTION - 100% MATCH TO IMAGE */}
      {selectedTab === 'UPCOMING' && (
        <>
        <div 
          className="relative min-h-[600px] h-[600px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${upcomingLaunch ? getLaunchImageUrl(upcomingLaunch) : HERO_BG_IMAGE}')`,
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
            {/* Date and Time - Above Launch Name, Smallest, Centered */}
            <div className="text-xs text-white mb-1">
              {upcomingLaunch?.launch_date 
                ? new Date(upcomingLaunch.launch_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) + ' | ' + new Date(upcomingLaunch.launch_date).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  }).toLowerCase()
                : new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) + ' | ' + new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  }).toLowerCase()
              }
            </div>

            {/* Launch Name - Largest */}
            <h2 className="text-8xl font-bold tracking-tight text-white mb-1">
              {upcomingLaunch?.name?.toUpperCase() || 'UPCOMING LAUNCH'}
            </h2>

            {/* Location - Medium Size */}
            <p className="text-xl font-light text-white tracking-wide mb-16">
              {upcomingLaunch?.site || upcomingLaunch?.site_name || 'Launch Site Information'}
            </p>

            {/* Countdown Timer - Large Numbers, White */}
            <div className="flex items-center gap-6 text-white">
              <div className="text-center">
                <div className="text-7xl font-mono  text-white">
                  {String(countdown.days).padStart(2, '0')}
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">DAYS</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono  text-white">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">HOURS</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono  text-white">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">MINUTES</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono  text-white">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">SECONDS</div>
              </div>
            </div>
          </div>
        </div>

        {/* ON THIS DAY IN HISTORY - Below hero countdown */}
        <div className="bg-black py-8">
          <div className="max-w-full mx-auto px-36">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">
              ON THIS DAY IN HISTORY
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {displayHistoricalLaunches.slice(0, 5).map((launch, idx) => {
                const launchImageUrl = getLaunchImageUrl(launch);
                
                return (
                <Link
                  key={idx}
                  to={`/launches/${getLaunchSlug(launch)}`}
                  className="relative h-44 bg-cover bg-center rounded overflow-hidden group cursor-pointer transition-all duration-300 hover:opacity-90"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${launchImageUrl}')` }}
                  ></div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <div className="h-0.5 bg-green-500 mb-1"></div>
                    <div className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">
                      {launch.provider || launch.provider_abbrev || 'Provider'}
                    </div>
                    <h4 className="text-[11px] font-bold text-white uppercase leading-tight mb-1">
                      {(launch.name || 'Launch Name').toUpperCase()}
                    </h4>
                    <p className="text-[8px] text-gray-400 leading-tight normal-case">
                      {launch.site || launch.site_name || 'Details here...'}
                    </p>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
        </>
      )}

      {/* HERO SECTION - PREVIOUS TAB */}
      {selectedTab === 'PREVIOUS' && (
        <>
        <div 
          className="relative min-h-[600px] h-[600px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${previousLaunch ? getLaunchImageUrl(previousLaunch) : HERO_BG_IMAGE}')`,
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
            {/* Date and Time - Above Launch Name, Smallest, Centered */}
            <div className="text-xs text-white mb-1">
              {previousLaunch?.launch_date 
                ? new Date(previousLaunch.launch_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) + ' | ' + new Date(previousLaunch.launch_date).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  }).toLowerCase()
                : new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) + ' | ' + new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  }).toLowerCase()
              }
            </div>

            {/* Launch Name - Largest */}
            <h2 className="text-8xl font-bold tracking-tight text-white mb-1">
              {previousLaunch?.name?.toUpperCase() || 'PREVIOUS LAUNCH'}
            </h2>

            {/* Location - Medium Size */}
            <p className="text-xl font-light text-white tracking-wide mb-16">
              {previousLaunch?.site || previousLaunch?.site_name || 'Launch Site Information'}
            </p>

            {/* Countdown Timer - Large Numbers, White */}
            <div className="flex items-center gap-6 text-white">
              <div className="text-center">
                <div className="text-7xl font-mono text-white">
                  00
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">DAYS</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono text-white">
                  00
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">HOURS</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono text-white">
                  00
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">MINUTES</div>
              </div>

              <span className="text-6xl font-thin text-white">:</span>

              <div className="text-center">
                <div className="text-7xl font-mono text-white">
                  00
                </div>
                <div className="text-xs uppercase tracking-widest text-white mt-1">SECONDS</div>
              </div>
            </div>
          </div>
        </div>

        {/* ON THIS DAY IN HISTORY - Below hero countdown */}
        <div className="bg-black py-8">
          <div className="max-w-full mx-auto px-36">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-gray-300 mb-6">
              ON THIS DAY IN HISTORY
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {displayHistoricalLaunches.slice(0, 5).map((launch, idx) => {
                const launchImageUrl = getLaunchImageUrl(launch);
                
                return (
                <Link
                  key={idx}
                  to={`/launches/${getLaunchSlug(launch)}`}
                  className="relative h-44 bg-cover bg-center rounded overflow-hidden group cursor-pointer transition-all duration-300 hover:opacity-90"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${launchImageUrl}')` }}
                  ></div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <div className="h-0.5 bg-green-500 mb-1"></div>
                    <div className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">
                      {launch.provider || launch.provider_abbrev || 'Provider'}
                    </div>
                    <h4 className="text-[11px] font-bold text-white uppercase leading-tight mb-1">
                      {(launch.name || 'Launch Name').toUpperCase()}
                    </h4>
                    <p className="text-[8px] text-gray-400 leading-tight normal-case">
                      {launch.site || launch.site_name || 'Details here...'}
                    </p>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Filter Bar */}
      <div className="bg-[#8B1A1A] border-b border-[#7A1515]">
        <div className="max-w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex gap-1">
            {['ALL', 'CANADA', 'AMERICA', 'EUROPE', 'DOWN UNDER', 'INDIA', 'RUSSIA', 'CHINA', 'OTHER'].map((region) => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                className={`px-3 py-1 uppercase text-xs font-bold ${
                  regionFilter === region
                    ? 'bg-white text-[#8B1A1A]'
                    : 'bg-transparent text-white'
                }`}
                style={regionFilter === region ? { backgroundColor: '#ffffff', color: '#8B1A1A' } : {}}
              >
                {region}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 uppercase text-xs w-80 focus:outline-none border-0 border-b border-white bg-transparent placeholder:text-white text-white"
          />
        </div>
      </div>

      {/* Thin Gray Divider Line */}
      <div className="h-px bg-gray-300"></div>

      {/* White Options Bar */}
      <div className="bg-white py-1">
        <div className="max-w-full mx-auto px-6 flex items-center gap-8">
          {/* Hide TBD Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative inline-block w-11 h-6">
              <input
                type="checkbox"
                checked={hideTBD}
                onChange={(e) => setHideTBD(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-gray-400 transition-colors duration-200"></div>
              <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${hideTBD ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-gray-400 text-xs">Hide TBD</span>
          </label>

          {/* Dropdown Filters - Now using LaunchFilters component */}
          <LaunchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      {/* Launch Grid by Month */}
      <div className="max-w-full mx-auto px-6 py-8 relative">
        {/* Legend - Top Right */}
        <div className="absolute top-8 right-6 flex items-center gap-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-green-500"></div>
            <span className="text-xs text-green-500 uppercase font-sans">MISSION SUCCESS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500"></div>
            <span className="text-xs text-orange-500 uppercase font-sans">PARTIAL FAILURE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500"></div>
            <span className="text-xs text-red-500 uppercase font-sans">MISSION FAILURE</span>
          </div>
        </div>

        {Object.entries(launchesByMonth).map(([month, monthLaunches]) => (
          <div key={month} className="mb-20">
            <h2 className="text-2xl  uppercase mb-10 tracking-tight text-white">{month}</h2>
                   <div className="grid grid-cols-3 gap-5">
                     {monthLaunches.map((launch) => {
                       const isSuccess = launch.outcome === 'success';
                       const isFailure = launch.outcome === 'failure';
                       const isPartial = launch.outcome === 'partial';
                       const eventTags = getEventTags(launch);
                       
                       // Determine border color
                       let borderColor = 'bg-gray-600';
                       if (isSuccess) borderColor = 'bg-green-500';
                       else if (isFailure) borderColor = 'bg-red-500';
                       else if (isPartial) borderColor = 'bg-orange-500';
                       
                       const launchImageUrl = getLaunchImageUrl(launch);
                       
                       return (
                         <div
                           key={launch.id}
                           className="bg-gray-900 rounded overflow-hidden relative"
                           style={{ minHeight: '180px' }}
                         >
                           {/* Background Image with Dark Overlay */}
                           <div 
                             className="absolute inset-0 bg-cover bg-center"
                             style={{ 
                               backgroundImage: `url('${launchImageUrl}')`,
                               opacity: launchImageUrl === HERO_BG_IMAGE ? 0.08 : 0.6
                             }}
                           ></div>
                           <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-900/55 to-black/60"></div>

                    {/* Vertical Colored Bar on Left */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`}></div>

                    <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center text-center">
                      <div>
                        <div className="text-[9px] text-gray-400 mb-2 font-bold uppercase tracking-widest">
                          {launch.provider || launch.provider_abbrev || 'Provider'}
                        </div>
                        <h3 className="text-base font-bold mb-2 leading-tight tracking-tight text-white uppercase">
                          {(launch.name || 'Launch Name').toUpperCase()}
                        </h3>
                        <p className="text-xs text-gray-400 leading-snug normal-case">
                          {launch.provider || launch.provider_abbrev || ''} {launch.rocket || ''} | {launch.site || launch.site_name || 'Location TBD'}
                        </p>
                        
                        {eventTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                            {eventTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-800 text-[9px] text-gray-300 flex items-center gap-1 border border-gray-600 uppercase"
                              >
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {launches.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No launches found</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {launches.length > 0 && pagination.has_more && (
        <div className="bg-black py-8 text-center">
          <button 
            onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
            className="text-white hover:text-gray-400 transition uppercase text-sm font-semibold tracking-widest"
          >
            V Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default LaunchCenter;