import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLaunchData } from '../hooks/useLaunchData';
import { useCountdown } from '../hooks/useCountdown';
import LaunchFilters from '../components/LaunchFilters';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config/api';
import { getLaunchSlug } from '../utils/slug';
import RedDotLoader from '../components/common/RedDotLoader';
import RecoveryBadge from '../components/RecoveryBadge';

const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

// Helper function to get status bar color for upcoming launches
const getUpcomingStatusBarColor = (launch) => {
  if (!launch) return 'bg-gray-500';
  
  const statusName = launch.status?.name?.toLowerCase() || launch.status_name?.toLowerCase() || '';
  const statusAbbrev = launch.status?.abbrev?.toLowerCase() || launch.status_abbrev?.toLowerCase() || '';
  const netPrecision = launch.net_precision;
  
  // Check if in flight (launch is happening now or very recently)
  const launchDate = launch.launch_date || launch.net;
  if (launchDate) {
    const now = new Date();
    const launchDateTime = new Date(launchDate);
    // Check if launch is within the last 3 hours (in flight window)
    const timeDiff = now.getTime() - launchDateTime.getTime();
    const isInFlight = timeDiff >= 0 && timeDiff <= 3 * 60 * 60 * 1000; // Within 3 hours after launch
    
    if (isInFlight) return 'bg-blue-500';
  }
  
  // Check for NET (No Earlier Than) - indicated by net_precision or status containing "net"
  const isNET = (netPrecision && (netPrecision.name?.toLowerCase().includes('net') || 
                                   netPrecision.abbrev?.toLowerCase().includes('net'))) ||
                statusName.includes('net') ||
                statusAbbrev.includes('net') ||
                (launch.net && !launch.launch_date); // If only NET date exists, not confirmed date
  
  if (isNET) return 'bg-yellow-500';
  
  // Check if unconfirmed (TBD or Hold)
  const isUnconfirmed = statusAbbrev === 'tbd' || 
                        statusAbbrev === 'hold' ||
                        statusName.includes('tbd') ||
                        statusName.includes('to be determined') ||
                        statusName.includes('hold') ||
                        !statusAbbrev; // No status means unconfirmed
  
  if (isUnconfirmed) return 'bg-gray-500';
  
  // Check if confirmed (Go status or any other confirmed status)
  const isConfirmed = statusAbbrev === 'go' || 
                      statusName.includes('go') ||
                      statusName.includes('confirmed') ||
                      (statusAbbrev && statusAbbrev !== 'tbd' && statusAbbrev !== 'hold');
  
  if (isConfirmed) return 'bg-green-500';
  
  // Default to grey for unconfirmed
  return 'bg-gray-500';
};

// Launch Card Component with Countdown (5-row layout)
const LaunchCardWithCountdown = ({ launch, getLaunchImageUrl }) => {
  const launchDate = launch.launch_date || launch.net;
  const countdown = useCountdown(launchDate);
  const borderColor = getUpcomingStatusBarColor(launch);
  const launchImageUrl = getLaunchImageUrl(launch);

  return (
    <Link
      to={`/launches/${getLaunchSlug(launch)}`}
      className="block bg-gray-900 rounded overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
      style={{ minHeight: '180px' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${launchImageUrl}')`,
          opacity: launchImageUrl === HERO_BG_IMAGE ? 0.08 : 0.6
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-900/55 to-black/60" />
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`} />

      <div className="relative z-10 p-4 h-full flex flex-col justify-center text-center">
        {/* Row 1: Date / Time */}
        {launchDate && (
          <p className="text-[10px] text-gray-400 leading-tight normal-case mb-1">
            {new Date(launchDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
            {' at '}
            {new Date(launchDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }).toLowerCase()}
          </p>
        )}

        {/* Row 2: Company */}
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">
          {launch.provider || launch.provider_abbrev || 'Provider'}
        </p>

        {/* Row 3: Rocket Name | Mission Name */}
        <p className="text-xs text-gray-300 leading-tight normal-case mb-1">
          {launch.rocket || 'Rocket'} | {(launch.name || 'Mission').toUpperCase()}
        </p>

        {/* Row 4: Launch Site */}
        <p className="text-[10px] text-gray-400 leading-tight normal-case mb-2">
          {launch.site || launch.site_name || 'Location TBD'}
        </p>

        <div className="mb-2">
          <RecoveryBadge launch={launch} />
        </div>

        {/* Row 5: Countdown */}
        {launchDate && new Date(launchDate) > new Date() && (
          <div className="flex items-center justify-center gap-1 text-white">
            <div className="flex flex-col items-center">
              <div className="text-lg font-mono text-white">{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">D</div>
            </div>
            <span className="text-sm font-medium text-white leading-none self-start pt-1.5">:</span>
            <div className="flex flex-col items-center">
              <div className="text-lg font-mono text-white">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">H</div>
            </div>
            <span className="text-sm font-medium text-white leading-none self-start pt-1.5">:</span>
            <div className="flex flex-col items-center">
              <div className="text-lg font-mono text-white">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">M</div>
            </div>
            <span className="text-sm font-medium text-white leading-none self-start pt-1.5">:</span>
            <div className="flex flex-col items-center">
              <div className="text-lg font-mono text-white">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="text-[8px] uppercase tracking-widest text-gray-400 mt-0.5">S</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

function UpcomingLaunches() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const {
    launches,
    heroLaunch,
    loading,
    regionFilter,
    setRegionFilter,
    searchInput,
    setSearchInput,
    handleSearch,
    hideTBD,
    setHideTBD,
    filters,
    setFilters,
    pagination,
    resetFilters,
    loadMore,
  } = useLaunchData('upcoming');

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [historicalLaunches, setHistoricalLaunches] = useState([]);

  const fetchHistoricalLaunches = useCallback(async (heroLaunchDate) => {
    if (!heroLaunchDate) {
      console.log('[Historical] No hero launch date provided');
      setHistoricalLaunches([]);
      return;
    }

    try {
      const date = new Date(heroLaunchDate);
      if (isNaN(date.getTime())) {
        console.error('[Historical] Invalid date:', heroLaunchDate);
        setHistoricalLaunches([]);
        return;
      }
      
      const month = date.getMonth() + 1; // getMonth() returns 0-11
      const day = date.getDate();
      const currentYear = date.getFullYear();

      console.log('[Historical] Fetching for date:', { month, day, currentYear, originalDate: heroLaunchDate });

      // Fetch historical launches from database via backend endpoint
      const response = await axios.get(`${API_URL}/api/launches/historical`, {
        params: {
          month: month,
          day: day,
          currentYear: currentYear,
        },
        timeout: 20000 // 20 second timeout
      });

      console.log('[Historical] Full response:', response.data);
      const launchesData = response.data?.data || [];
      console.log('[Historical] Launches data:', launchesData.length, launchesData);
      
      if (launchesData.length > 0) {
        console.log('[Historical] First launch:', launchesData[0]);
      }
      
      setHistoricalLaunches(launchesData);
    } catch (error) {
      console.error('[Historical] Error fetching historical launches:', error);
      console.error('[Historical] Error response:', error.response?.data);
      console.error('[Historical] Error message:', error.message);
      setHistoricalLaunches([]);
    }
  }, []);

  const startCountdown = (targetDate) => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = Math.abs(target - now); // Use absolute value to continue counting up

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  };

  const getLaunchImageUrl = (launch) => {
    if (!launch) return HERO_BG_IMAGE;
    if (launch.media?.image?.image_url) return launch.media.image.image_url;
    if (launch.mission_image_url) return launch.mission_image_url;
    if (launch.infographic_url) return launch.infographic_url;
    return HERO_BG_IMAGE;
  };

  const getLaunchName = (launch) => {
    const name = launch?.name || '';
    if (name.includes('|')) {
      const parts = name.split('|').map(part => part.trim());
      return {
        firstLine: parts[0] || '',
        secondLine: parts.slice(1).join(' | ') || '',
      };
    }
    return {
      firstLine: name,
      secondLine: '',
    };
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const urlStr = typeof url === 'string' ? url : url.url || '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = urlStr.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Find first YouTube URL from video URLs
  const getYouTubeUrl = (launch) => {
    if (!launch) return null;
    
    // Check launch vid_urls
    if (launch.vid_urls && Array.isArray(launch.vid_urls)) {
      for (const urlObj of launch.vid_urls) {
        const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
          return url;
        }
      }
    }
    
    // Check mission vid_urls
    if (launch.mission?.vid_urls && Array.isArray(launch.mission.vid_urls)) {
      for (const urlObj of launch.mission.vid_urls) {
        const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
          return url;
        }
      }
    }
    
    return null;
  };

  const upcomingLaunch = heroLaunch;

  useEffect(() => {
    if (upcomingLaunch?.launch_date) {
      const launchDate = upcomingLaunch.launch_date || upcomingLaunch.net;
      if (launchDate) {
        const cleanup = startCountdown(launchDate);
        // Fetch historical launches for the same month and day
        fetchHistoricalLaunches(launchDate);
        return cleanup;
      }
    } else {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setHistoricalLaunches([]);
    }
  }, [upcomingLaunch, fetchHistoricalLaunches]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const groupLaunchesByMonth = (launches) => {
    const groups = {};
    const monthDates = {}; // Store the actual date for sorting
    
    launches.forEach(launch => {
      const date = new Date(launch.launch_date);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[monthKey]) {
        groups[monthKey] = [];
        // Store first day of the month for sorting
        monthDates[monthKey] = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      groups[monthKey].push(launch);
    });
    
    // Sort months chronologically by their actual date
    const sortedEntries = Object.entries(groups).sort(([monthA], [monthB]) => {
      return monthDates[monthA].getTime() - monthDates[monthB].getTime();
    });
    
    return Object.fromEntries(sortedEntries);
  };

  const launchesByMonth = groupLaunchesByMonth(launches);

  if (loading && launches.length === 0) {
    return <RedDotLoader fullScreen={true} size="large" />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Main Navigation Bar */}
      <div className="bg-[#8B1A1A] border-t-2 border-white">
        <div className="max-w-full mx-4 sm:mx-6 md:mx-8 px-3 sm:px-6 py-2 sm:py-0 bg-[#8B1A1A]">
          <div className="flex items-center justify-between bg-[#8B1A1A]">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative" style={{ overflow: 'visible' }}>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black flex items-center justify-center overflow-hidden">
                  <img 
                    src="/TLP Helmet.png" 
                    alt="TLP Logo" 
                    className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                  />
                </div>
                <div className="absolute top-full left-0 w-10 sm:w-14 bg-[#8B1A1A] px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50 flex items-center justify-center">
                  {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '')}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
            </div>

            {/* Desktop Navigation - Left Side */}
            <div className="hidden lg:flex items-center gap-0 text-xs uppercase flex-1 ml-6">
              <Link
                to="/launches/upcoming"
                className={`px-3 py-2 ${location.pathname.includes('upcoming') ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                UPCOMING
              </Link>
              <span className="mx-1 font-bold text-white">|</span>
              <Link
                to="/launches/previous"
                className={`px-3 py-2 ${location.pathname.includes('previous') ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                PREVIOUS
              </Link>
              {/* STATISTICS link hidden for now */}
              {/* <span className="mx-1 font-bold text-white">|</span>
              <Link
                to="/launches/statistics"
                className={`px-3 py-2 ${location.pathname.includes('statistics') ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                STATISTICS
              </Link> */}
            </div>

            {/* Desktop YouTube Button - Right Side */}
            {upcomingLaunch && getYouTubeUrl(upcomingLaunch) && (
              <div className="hidden lg:block">
                <a
                  href={getYouTubeUrl(upcomingLaunch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-5 py-1.5 sm:py-2 bg-white text-black hover:bg-gray-100 transition uppercase text-[10px] sm:text-xs font-semibold whitespace-nowrap"
                >
                  Watch On Youtube
                </a>
              </div>
            )}

            {/* Mobile/Tablet Hamburger Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                className="text-white p-2 focus:outline-none"
                aria-label="Toggle navigation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {navMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {navMenuOpen && (
            <div className="lg:hidden mt-3 pb-3 border-t border-white/20 pt-3">
              <div className="flex flex-col gap-1">
                <Link
                  to="/launches/upcoming"
                  onClick={() => setNavMenuOpen(false)}
                  className={`px-3 py-2 text-xs uppercase ${location.pathname.includes('upcoming') ? 'text-white font-bold bg-white/10' : 'text-gray-300'}`}
                >
                  UPCOMING
                </Link>
                <Link
                  to="/launches/previous"
                  onClick={() => setNavMenuOpen(false)}
                  className={`px-3 py-2 text-xs uppercase ${location.pathname.includes('previous') ? 'text-white font-bold bg-white/10' : 'text-gray-300'}`}
                >
                  PREVIOUS
                </Link>
                {/* STATISTICS link hidden for now */}
                {/* <Link
                  to="/launches/statistics"
                  onClick={() => setNavMenuOpen(false)}
                  className={`px-3 py-2 text-xs uppercase ${location.pathname.includes('statistics') ? 'text-white font-bold bg-white/10' : 'text-gray-300'} text-left`}
                >
                  STATISTICS
                </Link> */}
                {upcomingLaunch && getYouTubeUrl(upcomingLaunch) && (
                  <a
                    href={getYouTubeUrl(upcomingLaunch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setNavMenuOpen(false)}
                    className="px-3 py-2 text-xs uppercase bg-white text-black font-semibold text-left"
                  >
                    Watch On Youtube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HERO SECTION */}
      {/* Hero Section with ON THIS DAY IN HISTORY - Single Background */}
      {upcomingLaunch ? (
        <Link
          to={`/launches/${getLaunchSlug(upcomingLaunch)}`}
          className="relative bg-cover bg-center bg-no-repeat block cursor-pointer hover:opacity-95 transition-opacity"
          style={{
            backgroundImage: `url('${getLaunchImageUrl(upcomingLaunch)}')`,
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Hero Content */}
          <div className="relative z-10 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] h-[400px] sm:h-[500px] lg:h-[600px] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center items-center text-center">
              <div className="text-[10px] sm:text-xs text-white mb-1">
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

              {(() => {
                const launchName = getLaunchName(upcomingLaunch);
                return (
                  <div className="mb-1">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white px-2">
                      {launchName.firstLine ? launchName.firstLine.toUpperCase() : 'UPCOMING LAUNCH'}
                    </h2>
                    {launchName.secondLine && (
                      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-gray-300 mt-2 px-2">
                        {launchName.secondLine.toUpperCase()}
                      </h3>
                    )}
                  </div>
                );
              })()}

              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white tracking-wide mb-8 sm:mb-12 lg:mb-16 px-4">
                {upcomingLaunch?.site || upcomingLaunch?.site_name || 'Launch Site Information'}
              </p>

              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 text-white px-4">
                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono text-white">
                    {String(countdown.days).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-white mt-0.5 sm:mt-1">DAYS</div>
                </div>
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-white leading-none self-start pt-1.5 sm:pt-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono text-white">
                    {String(countdown.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-white mt-0.5 sm:mt-1">HOURS</div>
                </div>
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-white leading-none self-start pt-1.5 sm:pt-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono text-white">
                    {String(countdown.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-white mt-0.5 sm:mt-1">MINUTES</div>
                </div>
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-white leading-none self-start pt-1.5 sm:pt-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono text-white">
                    {String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-white mt-0.5 sm:mt-1">SECONDS</div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div 
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${HERO_BG_IMAGE}')`,
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>

          {/* Hero Content */}
          <div className="relative z-10 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] h-[400px] sm:h-[500px] lg:h-[600px] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center items-center text-center">
              <div className="text-[10px] sm:text-xs text-white mb-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) + ' | ' + new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }).toLowerCase()}
              </div>

              <div className="mb-1">
                <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white px-2">
                  UPCOMING LAUNCH
                </h2>
              </div>

              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white tracking-wide mb-8 sm:mb-12 lg:mb-16 px-4">
                Launch Site Information
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED LAUNCHES */}
        <div className="relative z-10 py-4 sm:py-6 lg:py-8">
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 max-w-full mx-auto px-4 sm:px-6 md:px-12 lg:px-24 xl:px-36">
          <h3 className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-300 mb-4 sm:mb-6">
            FEATURED LAUNCHES
          </h3>
          
          {/* Mobile Carousel */}
          <div className="sm:hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4">
              {launches && launches.length > 0 ? (
                launches.slice(0, 6).map((launch, idx) => (
                  <div key={launch.id || launch.external_id || idx} className="w-[280px] shrink-0 snap-center">
                    <LaunchCardWithCountdown launch={launch} getLaunchImageUrl={getLaunchImageUrl} />
                  </div>
                ))
              ) : (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="relative h-44 w-[280px] shrink-0 snap-center bg-gray-900 rounded overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                      <div className="h-0.5 bg-gray-700 mb-1"></div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        NO DATA
                      </div>
                      <h4 className="text-[11px] font-bold text-gray-600 uppercase leading-tight mb-1">
                        NO UPCOMING LAUNCH
                      </h4>
                      <p className="text-[8px] text-gray-500 leading-tight normal-case">
                        No launches available
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Grid - Featured (max 6) */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-2 sm:gap-3">
            {launches && launches.length > 0 ? (
              launches.slice(0, 6).map((launch, idx) => (
                <LaunchCardWithCountdown
                  key={launch.id || launch.external_id || idx}
                  launch={launch}
                  getLaunchImageUrl={getLaunchImageUrl}
                />
              ))
            ) : (
              Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="relative h-40 lg:h-44 bg-gray-900 rounded overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <div className="h-0.5 bg-gray-700 mb-1"></div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                      NO DATA
                    </div>
                    <h4 className="text-[11px] font-bold text-gray-600 uppercase leading-tight mb-1">
                      NO UPCOMING LAUNCH
                    </h4>
                    <p className="text-[8px] text-gray-500 leading-tight normal-case">
                      No launches available
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#8B1A1A] border-b border-[#7A1515] px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="max-w-full mx-auto px-3 sm:px-6 py-2 sm:py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
            {['ALL', 'CANADA', 'AMERICA', 'EUROPE', 'DOWN UNDER', 'INDIA', 'RUSSIA', 'CHINA', 'ASIA', 'OTHER'].map((region) => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                  className={`px-2 sm:px-3 py-1 uppercase text-[10px] sm:text-xs font-bold ${
                  regionFilter === region
                    ? 'bg-white text-[#8B1A1A]'
                    : 'bg-transparent text-white'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="SEARCH"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs w-full sm:w-64 md:w-80 focus:outline-none border-0 border-b border-white bg-transparent placeholder:text-white placeholder:uppercase text-white"
            />
            <button
              onClick={handleSearch}
                className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white text-gray-900 uppercase text-[10px] sm:text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              SEARCH
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-300"></div>

      {/* Filters Section */}
      <div className="bg-white">
        {/* Desktop View */}
        <div className="hidden md:block py-1 px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="max-w-full mx-auto px-4 md:px-6">
            <div className="flex items-center gap-4 md:gap-8">
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
          <LaunchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
          />
            </div>
          </div>
        </div>

        {/* Mobile View - Collapsible Menu */}
        <div className="md:hidden">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            aria-label="Toggle filters"
          >
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block w-10 h-5">
                  <input
                    type="checkbox"
                    checked={hideTBD}
                    onChange={(e) => setHideTBD(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-400 transition-colors duration-200"></div>
                  <div className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hideTBD ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-gray-700 text-sm font-medium">Filters</span>
              </label>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Filters Content */}
          {filtersOpen && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <LaunchFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={resetFilters}
              />
            </div>
          )}
        </div>
      </div>

        {/* Launch Grid by Month */}
        <div className="max-w-full mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8 relative">
          <div className="absolute top-4 sm:top-8 right-6 sm:right-8 md:right-12 lg:right-16 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-green-500"></div>
            <span className="text-xs text-green-500 uppercase font-sans">LAUNCH CONFIRMED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-yellow-500"></div>
            <span className="text-xs text-yellow-500 uppercase font-sans">NO EARLIER THAN</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gray-500"></div>
            <span className="text-xs text-gray-500 uppercase font-sans">UNCONFIRMED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500"></div>
            <span className="text-xs text-blue-500 uppercase font-sans">IN FLIGHT</span>
          </div>
        </div>

        {Object.entries(launchesByMonth).map(([month, monthLaunches]) => (
          <div key={month} className="mb-20">
            <h2 className="text-2xl uppercase mb-10 tracking-tight text-white">{month}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {monthLaunches.map((launch) => (
                <LaunchCardWithCountdown 
                  key={launch.id || launch.external_id || Math.random()}
                  launch={launch}
                  getLaunchImageUrl={getLaunchImageUrl}
                />
              ))}
            </div>
          </div>
        ))}

        {launches.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No upcoming launches found</p>
          </div>
        )}
      </div>

      {launches.length > 0 && pagination.has_more && (
        <div className="bg-black py-8 text-center">
          <button 
            onClick={loadMore}
            className="text-white hover:text-gray-400 transition uppercase text-sm font-semibold tracking-widest"
          >
            V Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default UpcomingLaunches;

