import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

// Use this exact image for 100% match
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

function LaunchCenter() {
  const [launches, setLaunches] = useState([]);
  const [filteredLaunches, setFilteredLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('UPCOMING');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideTBD, setHideTBD] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchLaunches();
  }, []);

  useEffect(() => {
    if (launches.length > 0) {
      applyFilters();
    }
    // Always set countdown to 00:00:00:00
    setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  }, [launches, regionFilter, searchQuery, selectedTab, hideTBD]);

  const startCountdown = (targetDate) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const fetchLaunches = async () => {
    try {
      const response = await axios.get(`${API_URL}/launches`);
      const sorted = response.data.sort((a, b) =>
        new Date(b.launch_date).getTime() - new Date(a.launch_date).getTime()
      );
      setLaunches(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching launches:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...launches];

    const now = new Date();
    if (selectedTab === 'UPCOMING') {
      filtered = filtered.filter(l => new Date(l.launch_date) >= now);
    } else if (selectedTab === 'PREVIOUS') {
      filtered = filtered.filter(l => new Date(l.launch_date) < now);
    }

    if (regionFilter !== 'ALL') {
      const regionMap = {
        AMERICA: ['USA', 'United States', 'Kennedy', 'Cape Canaveral', 'Florida', 'California', 'Texas'],
        CANADA: ['Canada'],
        EUROPE: ['Europe', 'French', 'Kourou'],
        RUSSIA: ['Russia', 'Baikonur', 'Roscosmos'],
        CHINA: ['China'],
        INDIA: ['India'],
        'DOWN UNDER': ['Australia'],
      };
      const keywords = regionMap[regionFilter] || [];
      filtered = filtered.filter(l =>
        keywords.some(kw =>
          l.site?.toLowerCase().includes(kw.toLowerCase()) ||
          l.provider?.toLowerCase().includes(kw.toLowerCase())
        )
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.rocket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.provider?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (hideTBD) {
      filtered = filtered.filter(l => l.outcome && !['TBD', 'tbd'].includes(l.outcome));
    }

    filtered.sort((a, b) => new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime());
    setFilteredLaunches(filtered);
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

  const allUpcoming = launches
    .filter(l => new Date(l.launch_date) > new Date())
    .sort((a, b) => new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime());
  const starlink69420 = allUpcoming.find(l => l.name?.includes('69-420'));
  const upcomingLaunch = starlink69420 || allUpcoming[0];
  
  const allPrevious = launches
    .filter(l => new Date(l.launch_date) < new Date())
    .sort((a, b) => new Date(b.launch_date).getTime() - new Date(a.launch_date).getTime());
  const previousLaunch = allPrevious && allPrevious.length > 0 ? allPrevious[0] : null;
  
  const historicalLaunches = launches
    .filter(l => new Date(l.launch_date) < new Date())
    .slice(0, 5);
  
  // Ensure we always have 5 cards for display
  const displayHistoricalLaunches = historicalLaunches.length >= 5 
    ? historicalLaunches 
    : [...historicalLaunches, ...launches.slice(0, 5 - historicalLaunches.length)];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-xl">Loading launches...</div>
      </div>
    );
  }

  const launchesByMonth = groupLaunchesByMonth(filteredLaunches);

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
      {upcomingLaunch && selectedTab === 'UPCOMING' && (
        <>
        <div 
          className="relative h-[600px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${HERO_BG_IMAGE}')`,
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>

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
              {upcomingLaunch.name?.toUpperCase() || 'UPCOMING LAUNCH'}
            </h2>

            {/* Location - Medium Size */}
            <p className="text-xl font-light text-white tracking-wide mb-16">
              {upcomingLaunch.site || 'Launch Site Information'}
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
              {displayHistoricalLaunches.slice(0, 5).map((launch, idx) => (
                <div 
                  key={idx} 
                  className="relative h-44 bg-cover bg-center rounded overflow-hidden group cursor-pointer transition-all duration-300"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}
                  ></div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <div className="h-0.5 bg-green-500 mb-1"></div>
                    <div className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">
                      {launch.provider || 'Starlink'}
                    </div>
                    <h4 className="text-[11px] font-bold text-white uppercase leading-tight mb-1">
                      {launch.name?.toUpperCase() || 'STARLINK 69-420'}
                    </h4>
                    <p className="text-[8px] text-gray-400 leading-tight normal-case">
                      {launch.site || 'Details here...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      {/* HERO SECTION - PREVIOUS TAB */}
      {selectedTab === 'PREVIOUS' && (
        <>
        <div 
          className="relative h-[600px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${HERO_BG_IMAGE}')`,
            backgroundPosition: 'center 30%',
          }}
        >
          <div className="absolute inset-0 bg-black/70"></div>

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
              {previousLaunch?.site || 'Launch Site Information'}
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
              {displayHistoricalLaunches.slice(0, 5).map((launch, idx) => (
                <div 
                  key={idx} 
                  className="relative h-44 bg-cover bg-center rounded overflow-hidden group cursor-pointer transition-all duration-300"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}
                  ></div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <div className="h-0.5 bg-green-500 mb-1"></div>
                    <div className="text-[9px] font-bold text-white uppercase tracking-widest mb-1">
                      {launch.provider || 'Starlink'}
                    </div>
                    <h4 className="text-[11px] font-bold text-white uppercase leading-tight mb-1">
                      {launch.name?.toUpperCase() || 'STARLINK 69-420'}
                    </h4>
                    <p className="text-[8px] text-gray-400 leading-tight normal-case">
                      {launch.site || 'Details here...'}
                    </p>
                  </div>
                </div>
              ))}
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

          {/* Dropdown Filters */}
          <div className="flex items-center gap-8">
            {/* Launch Site Dropdown */}
            <div className="relative cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Launch Site</span>
                  <span className="text-gray-400 text-xs leading-none">▼</span>
                </div>
                <div className="w-full h-px bg-gray-300 mt-1"></div>
              </div>
            </div>

            {/* Launch Provider Dropdown */}
            <div className="relative cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Launch Provider</span>
                  <span className="text-gray-400 text-xs leading-none">▼</span>
                </div>
                <div className="w-full h-px bg-gray-300 mt-1"></div>
              </div>
            </div>

            {/* Rocket Dropdown */}
            <div className="relative cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Rocket</span>
                  <span className="text-gray-400 text-xs leading-none">▼</span>
                </div>
                <div className="w-full h-px bg-gray-300 mt-1"></div>
              </div>
            </div>

            {/* Mission Type Dropdown */}
            <div className="relative cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Mission Type</span>
                  <span className="text-gray-400 text-xs leading-none">▼</span>
                </div>
                <div className="w-full h-px bg-gray-300 mt-1"></div>
              </div>
            </div>
          </div>
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
                        backgroundImage: `url('${HERO_BG_IMAGE}')`,
                        opacity: 0.08
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-gray-900/85 to-black/90"></div>

                    {/* Vertical Colored Bar on Left */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`}></div>

                    <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center text-center">
                      <div>
                        <div className="text-[9px] text-gray-400 mb-2 font-bold uppercase tracking-widest">{launch.provider}</div>
                        <h3 className="text-base font-bold mb-2 leading-tight tracking-tight text-white uppercase">
                          {launch.name.toUpperCase()}
                        </h3>
                        <p className="text-xs text-gray-400 leading-snug normal-case">
                          {launch.provider} {launch.rocket} | {launch.site}
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

        {filteredLaunches.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No launches found</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredLaunches.length > 0 && (
        <div className="bg-black py-8 text-center">
          <button className="text-white hover:text-gray-400 transition uppercase text-sm font-semibold tracking-widest">
            V Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default LaunchCenter;