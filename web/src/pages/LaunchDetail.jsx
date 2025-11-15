import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const LaunchDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [launch, setLaunch] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const tabs = ['OVERVIEW', 'LAUNCH SERVICE PROVIDER', 'ROCKET', 'MISSION', 'PAD', 'PAYLOADS', 'CREW', 'RECOVERY', 'HAZARDS', 'UPDATES', 'TIMELINE', 'MEDIA', 'STATISTICS', 'PROGRAM', 'PATCHES'];

  useEffect(() => {
    fetchLaunch();
  }, [id]);

  useEffect(() => {
    if (launch?.net) {
      startCountdown(launch.net);
    }
  }, [launch]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'pm' : 'am';
      setCurrentTime(`${hours}:${minutes}${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLaunch = async () => {
    try {
      const [launchRes, storiesRes] = await Promise.all([
        axios.get(`${API_URL}/api/launches/${id}`),
        axios.get(`${API_URL}/api/news?limit=4&status=published`),
      ]);

      setLaunch(launchRes.data);
      
      const storiesData = Array.isArray(storiesRes.data) 
        ? storiesRes.data 
        : storiesRes.data?.data || [];
      setRelatedStories(storiesData.slice(0, 4));
    } catch (error) {
      console.error('Error fetching launch:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getLaunchImageUrl = (launch) => {
    if (!launch) return HERO_BG_IMAGE;
    // Try image object first (new API structure)
    if (launch.image?.image_url) return launch.image.image_url;
    // Fallback to old structure
    if (launch.image_json?.image_url) return launch.image_json.image_url;
    if (launch.media?.image?.image_url) return launch.media.image.image_url;
    if (launch.mission_image_url) return launch.mission_image_url;
    if (launch.infographic_url) return launch.infographic_url;
    return HERO_BG_IMAGE;
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
  const getYouTubeUrl = () => {
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

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading launch details...
        </div>
      </Layout>
    );
  }

  if (!launch) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Launch Not Found</h1>
          <Link to="/launches/upcoming" className="text-[#8B1A1A] hover:text-[#A02A2A]">
            Return to Launch Center
          </Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getLaunchName = () => {
    const name = launch?.name || 'Launch Name TBD';
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

  const launchImageUrl = getLaunchImageUrl(launch);
  const isUpcoming = launch.net && new Date(launch.net) > new Date();
  const launchName = getLaunchName();
  
  // Helper to safely parse JSONB fields
  const parseJsonb = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return value;
  };

  // Handle both transformed format (launch_service_provider) and raw format (launch_service_provider_json)
  const launchServiceProvider = launch.launch_service_provider || parseJsonb(launch.launch_service_provider_json) || {};
  
  // Handle rocket data - check if it's already an object or needs parsing
  let rocketRaw = null;
  if (launch.rocket) {
    // If rocket is already an object (from formatLaunchResponse), use it
    if (typeof launch.rocket === 'object' && launch.rocket !== null) {
      rocketRaw = launch.rocket;
    } else if (typeof launch.rocket === 'string') {
      // If it's a string (old database format), try to parse it or create a basic object
      try {
        rocketRaw = JSON.parse(launch.rocket);
      } catch (e) {
        // If parsing fails, it's just a name string, create a basic object
        rocketRaw = { name: launch.rocket };
      }
    }
  }
  
  // If rocket wasn't found or parsed, try rocket_json
  if (!rocketRaw || (typeof rocketRaw === 'object' && Object.keys(rocketRaw).length === 0)) {
    rocketRaw = parseJsonb(launch.rocket_json) || {};
  }
  
  // Ensure rocket has configuration if it exists in the raw data
  // The rocket object from API should have configuration nested inside it
  // If rocketRaw is a string, convert it to an object with a name
  if (typeof rocketRaw === 'string') {
    rocketRaw = { name: rocketRaw };
  }
  
  const rocket = rocketRaw && typeof rocketRaw === 'object' && (rocketRaw.configuration || rocketRaw.id || rocketRaw.name || Object.keys(rocketRaw).length > 0) ? rocketRaw : {};
  const mission = launch.mission || parseJsonb(launch.mission_json) || {};
  const pad = launch.pad || parseJsonb(launch.pad_json) || {};
  const status = launch.status || parseJsonb(launch.status_json) || {};
  const image = launch.image || parseJsonb(launch.image_json) || {};
  const infographic = launch.infographic || parseJsonb(launch.infographic_json) || {};
  const program = launch.program || parseJsonb(launch.program_json) || [];

  // Debug: Log data structure
  if (launch && Object.keys(launch).length > 0) {
    console.log('[LaunchDetail] Received launch data:', {
      id: launch.id,
      name: launch.name,
      hasLaunchServiceProvider: !!(launch.launch_service_provider || launch.launch_service_provider_json),
      launchServiceProvider: launchServiceProvider,
      hasRocket: !!(launch.rocket || launch.rocket_json),
      rocketRaw: rocketRaw,
      rocket: rocket,
      hasRocketConfiguration: !!(rocket && rocket.configuration),
      hasPad: !!(launch.pad || launch.pad_json),
      hasMission: !!(launch.mission || launch.mission_json),
      rawFormat: !!launch.launch_service_provider_json,
      arrays: {
        updates: `${launch.updates ? launch.updates.length : 0} items`,
        timeline: `${launch.timeline ? launch.timeline.length : 0} items`,
        vid_urls: `${launch.vid_urls ? launch.vid_urls.length : 0} items`,
        info_urls: `${launch.info_urls ? launch.info_urls.length : 0} items`,
        mission_patches: `${launch.mission_patches ? launch.mission_patches.length : 0} items`
      },
      statistics: {
        orbital_launch_attempt_count: launch.orbital_launch_attempt_count,
        pad_launch_attempt_count: launch.pad_launch_attempt_count,
        agency_launch_attempt_count: launch.agency_launch_attempt_count,
        pad_turnaround: launch.pad_turnaround
      }
    });
    
    // Log array data in detail if empty
    if (!launch.timeline || launch.timeline.length === 0) {
      console.warn('[LaunchDetail] Timeline is empty or missing');
    }
    if (!launch.updates || launch.updates.length === 0) {
      console.warn('[LaunchDetail] Updates is empty or missing');
    }
    if (!launch.mission_patches || launch.mission_patches.length === 0) {
      console.warn('[LaunchDetail] Mission patches is empty or missing');
    }
  }

  // Get YouTube URL and video ID
  const youtubeUrl = launch ? getYouTubeUrl() : null;
  const youtubeVideoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;

  const sectionNav = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" style={{ overflow: 'visible' }}>
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black flex items-center justify-center overflow-hidden">
            <img 
              src="/TLP Helmet.png" 
              alt="TLP Logo" 
              className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
            />
      </div>
          <div className="absolute top-full left-0 bg-[#8B1A1A] px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
            {currentTime}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
      </div>
      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-white text-black hover:bg-gray-100 transition uppercase text-[10px] sm:text-xs font-semibold whitespace-nowrap"
        >
          Watch On Youtube
        </a>
      )}
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Hero Section with Image - Single Background Container */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${launchImageUrl}')`,
          backgroundPosition: 'center 30%',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Hero Content */}
        <div className="relative z-10 min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="text-xs sm:text-sm text-gray-400 mb-2">{formatDate(launch.net)}</div>
            <div className="mb-3 sm:mb-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">{launchName.firstLine}</h1>
              {launchName.secondLine && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-300 mt-2">{launchName.secondLine}</h2>
              )}
            </div>
            <div className="text-sm sm:text-base lg:text-lg text-gray-300 mb-3 sm:mb-4">
              {launchServiceProvider.name || 'Provider TBD'} | {rocket.configuration?.name || 'Rocket TBD'}
            </div>
            <div className="text-sm sm:text-base lg:text-lg text-gray-400 mb-4 sm:mb-6">
              {pad.location?.name || 'Location TBD'} | {pad.country_code || pad.location?.country_code || 'Country TBD'}
            </div>

            {/* Mission Description */}
            {mission.description && (
              <div className="max-w-3xl mb-6">
                <p className="text-gray-300 leading-relaxed">{mission.description}</p>
              </div>
            )}
            
            {/* Status Badge */}
            {status.name && (
              <div className="inline-block mb-4">
                <span className={`px-4 py-2 text-sm font-bold ${
                  status.abbrev === 'Success' ? 'bg-green-600 text-white' :
                  status.abbrev === 'Failure' ? 'bg-red-600 text-white' :
                  status.abbrev === 'Partial' ? 'bg-orange-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {status.name.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Countdown Timer - Only for upcoming launches */}
        {isUpcoming && (
          <div className="relative z-10 border-b border-gray-800 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-3 sm:mb-4 text-gray-400 uppercase text-xs sm:text-sm tracking-widest">Time Until Launch</div>
              <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold">
                <div className="text-center">
                  <div className="text-white">{String(countdown.days).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">DAYS</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.hours).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">HOURS</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.minutes).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">MINUTES</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.seconds).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">SECONDS</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Mission Image/Infographic or YouTube Embed */}
            {youtubeVideoId ? (
              <div className="bg-gray-900 p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">MISSION VIDEO</h3>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title="Mission Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ) : (image.image_url || infographic.image_url) && (
              <div className="bg-gray-900 p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">MISSION IMAGE</h3>
                <img 
                  src={image.image_url || infographic.image_url} 
                  alt={launch.name}
                  className="w-full h-auto rounded"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors ${
                    activeTab === tab
                      ? 'bg-[#8B1A1A] text-white font-semibold'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-900 p-4 sm:p-6 min-h-[400px]">
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {launch.id && (
                      <div>
                        <span className="text-gray-400">Launch ID:</span>{' '}
                        <span className="font-semibold text-white">{launch.id}</span>
                      </div>
                    )}
                    {launch.name && (
                      <div>
                        <span className="text-gray-400">Name:</span>{' '}
                        <span className="font-semibold text-white">{launch.name}</span>
                      </div>
                    )}
                    {launch.slug && (
                      <div>
                        <span className="text-gray-400">Slug:</span>{' '}
                        <span className="font-semibold text-white">{launch.slug}</span>
                      </div>
                    )}
                    {launch.launch_designator && (
                      <div>
                        <span className="text-gray-400">Launch Designator:</span>{' '}
                        <span className="font-semibold text-white">{launch.launch_designator}</span>
                      </div>
                    )}
                    {launch.url && (
                      <div>
                        <span className="text-gray-400">Launch URL:</span>{' '}
                        <a 
                          href={launch.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                        >
                          View Details
                        </a>
                      </div>
                    )}
                    {launch.response_mode && (
                      <div>
                        <span className="text-gray-400">Response Mode:</span>{' '}
                        <span className="font-semibold text-white">{launch.response_mode}</span>
                      </div>
                    )}
                    {launch.last_updated && (
                      <div>
                        <span className="text-gray-400">Last Updated:</span>{' '}
                        <span className="font-semibold text-white">{formatDate(launch.last_updated)}</span>
                      </div>
                    )}
                    {status && (
                      <>
                        {status.id && (
                          <div>
                            <span className="text-gray-400">Status ID:</span>{' '}
                            <span className="font-semibold text-white">{status.id}</span>
                          </div>
                        )}
                        {status.name && (
                          <div>
                            <span className="text-gray-400">Status:</span>{' '}
                            <span className="font-semibold text-white">{status.name}</span>
                          </div>
                        )}
                        {status.abbrev && (
                          <div>
                            <span className="text-gray-400">Status Abbreviation:</span>{' '}
                            <span className="font-semibold text-white">{status.abbrev}</span>
                          </div>
                        )}
                        {status.description && (
                          <div>
                            <span className="text-gray-400">Status Description:</span>{' '}
                            <span className="font-semibold text-white">{status.description}</span>
                          </div>
                        )}
                      </>
                    )}
                    {launch.net && (
                      <div>
                        <span className="text-gray-400">Launch Date (NET):</span>{' '}
                        <span className="font-semibold text-white">{formatDate(launch.net)}</span>
                      </div>
                    )}
                    {launch.net_precision && (
                      <div>
                        <span className="text-gray-400">NET Precision:</span>{' '}
                        <span className="font-semibold text-white">
                          {typeof launch.net_precision === 'object' 
                            ? launch.net_precision.name || launch.net_precision.abbrev || launch.net_precision 
                            : launch.net_precision}
                        </span>
                      </div>
                    )}
                    {launch.window_start && (
                      <div>
                        <span className="text-gray-400">Window Start:</span>{' '}
                        <span className="font-semibold text-white">{formatDate(launch.window_start)}</span>
                      </div>
                    )}
                    {launch.window_end && (
                      <div>
                        <span className="text-gray-400">Window End:</span>{' '}
                        <span className="font-semibold text-white">{formatDate(launch.window_end)}</span>
                      </div>
                    )}
                    {launch.probability !== null && launch.probability !== undefined && (
                      <div>
                        <span className="text-gray-400">Probability:</span>{' '}
                        <span className="font-semibold text-white">{launch.probability}%</span>
                      </div>
                    )}
                    {launch.weather_concerns && (
                      <div>
                        <span className="text-gray-400">Weather Concerns:</span>{' '}
                        <span className="font-semibold text-white">
                          {typeof launch.weather_concerns === 'string' 
                            ? launch.weather_concerns 
                            : typeof launch.weather_concerns === 'object' 
                              ? JSON.stringify(launch.weather_concerns) 
                              : 'N/A'}
                        </span>
                      </div>
                    )}
                    {launch.failreason && (
                      <div>
                        <span className="text-gray-400">Fail Reason:</span>{' '}
                        <span className="font-semibold text-red-500">{launch.failreason}</span>
                      </div>
                    )}
                    {launch.hashtag && (
                      <div>
                        <span className="text-gray-400">Hashtag:</span>{' '}
                        <span className="font-semibold text-white">
                          {typeof launch.hashtag === 'string' 
                            ? launch.hashtag 
                            : typeof launch.hashtag === 'object' 
                              ? JSON.stringify(launch.hashtag) 
                              : 'N/A'}
                        </span>
                      </div>
                    )}
                    {launch.webcast_live !== undefined && (
                      <div>
                        <span className="text-gray-400">Webcast Live:</span>{' '}
                        <span className="font-semibold text-white">{launch.webcast_live ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {launch.flightclub_url && (
                      <div>
                        <span className="text-gray-400">Flight Club URL:</span>{' '}
                        <a 
                          href={launch.flightclub_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                        >
                          View on Flight Club
                        </a>
                      </div>
                    )}
                    {launch.pad_turnaround && (
                      <div>
                        <span className="text-gray-400">Pad Turnaround:</span>{' '}
                        <span className="font-semibold text-white">{launch.pad_turnaround}</span>
                      </div>
                    )}
                    {launch.orbital_launch_attempt_count !== null && launch.orbital_launch_attempt_count !== undefined && (
                      <div>
                        <span className="text-gray-400">Orbital Launch Attempt Count:</span>{' '}
                        <span className="font-semibold text-white">{launch.orbital_launch_attempt_count}</span>
                      </div>
                    )}
                    {launch.location_launch_attempt_count !== null && launch.location_launch_attempt_count !== undefined && (
                      <div>
                        <span className="text-gray-400">Location Launch Attempt Count:</span>{' '}
                        <span className="font-semibold text-white">{launch.location_launch_attempt_count}</span>
                      </div>
                    )}
                    {launch.pad_launch_attempt_count !== null && launch.pad_launch_attempt_count !== undefined && (
                      <div>
                        <span className="text-gray-400">Pad Launch Attempt Count:</span>{' '}
                        <span className="font-semibold text-white">{launch.pad_launch_attempt_count}</span>
                      </div>
                    )}
                    {launch.agency_launch_attempt_count !== null && launch.agency_launch_attempt_count !== undefined && (
                      <div>
                        <span className="text-gray-400">Agency Launch Attempt Count:</span>{' '}
                        <span className="font-semibold text-white">{launch.agency_launch_attempt_count}</span>
                      </div>
                    )}
                    {launch.orbital_launch_attempt_count_year !== null && launch.orbital_launch_attempt_count_year !== undefined && (
                      <div>
                        <span className="text-gray-400">Orbital Launch Attempt Count (Year):</span>{' '}
                        <span className="font-semibold text-white">{launch.orbital_launch_attempt_count_year}</span>
                      </div>
                    )}
                    {launch.location_launch_attempt_count_year !== null && launch.location_launch_attempt_count_year !== undefined && (
                      <div>
                        <span className="text-gray-400">Location Launch Attempt Count (Year):</span>{' '}
                        <span className="font-semibold text-white">{launch.location_launch_attempt_count_year}</span>
                      </div>
                    )}
                    {launch.pad_launch_attempt_count_year !== null && launch.pad_launch_attempt_count_year !== undefined && (
                      <div>
                        <span className="text-gray-400">Pad Launch Attempt Count (Year):</span>{' '}
                        <span className="font-semibold text-white">{launch.pad_launch_attempt_count_year}</span>
                      </div>
                    )}
                    {launch.agency_launch_attempt_count_year !== null && launch.agency_launch_attempt_count_year !== undefined && (
                      <div>
                        <span className="text-gray-400">Agency Launch Attempt Count (Year):</span>{' '}
                        <span className="font-semibold text-white">{launch.agency_launch_attempt_count_year}</span>
                      </div>
                    )}
                  </div>
                  
                  {mission.description && (
                    <div>
                      <h4 className="text-lg font-bold mb-2">Mission Description</h4>
                      <p className="text-gray-300 leading-relaxed">{mission.description}</p>
                    </div>
                  )}

                  {launch.probability !== null && launch.probability !== undefined && (
                    <div>
                      <h4 className="text-lg font-bold mb-2">Launch Success Probability</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-800 rounded-full h-4">
                          <div 
                            className="bg-[#8B1A1A] h-4 rounded-full"
                            style={{ width: `${launch.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-300 font-semibold">{launch.probability}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'PAYLOADS' && (
                <div className="space-y-4">
                  {launch.payloads && launch.payloads.length > 0 ? (
                    launch.payloads.map((payload, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-3">{payload.name || 'Unnamed Payload'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {payload.type && (
                            <div>
                              <span className="text-gray-400">Type:</span>{' '}
                              <span className="font-semibold text-white">{payload.type}</span>
                            </div>
                          )}
                          {payload.mass_kg && (
                            <div>
                              <span className="text-gray-400">Mass:</span>{' '}
                              <span className="font-semibold text-white">{payload.mass_kg} kg</span>
                            </div>
                          )}
                          {payload.orbit && (
                            <div>
                              <span className="text-gray-400">Orbit:</span>{' '}
                              <span className="font-semibold text-white">{payload.orbit}</span>
                            </div>
                          )}
                          {payload.nationality && (
                            <div>
                              <span className="text-gray-400">Nationality:</span>{' '}
                              <span className="font-semibold text-white">{payload.nationality}</span>
                            </div>
                          )}
                          {payload.manufacturer && (
                            <div>
                              <span className="text-gray-400">Manufacturer:</span>{' '}
                              <span className="font-semibold text-white">{payload.manufacturer}</span>
                            </div>
                          )}
                          {payload.customers && Array.isArray(payload.customers) && payload.customers.length > 0 && (
                            <div>
                              <span className="text-gray-400">Customers:</span>{' '}
                              <span className="font-semibold text-white">{payload.customers.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {payload.description && (
                          <p className="text-sm text-gray-400 mt-3 leading-relaxed">{payload.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No payload information available.</p>
                )}
              </div>
              )}
              
              {activeTab === 'CREW' && (
                <div className="space-y-4">
                  {launch.crew && launch.crew.length > 0 ? (
                    launch.crew.map((member, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-3">{member.name || 'Unknown'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {member.role && (
                            <div>
                              <span className="text-gray-400">Role:</span>{' '}
                              <span className="font-semibold text-white">{member.role}</span>
            </div>
                          )}
                          {member.nationality && (
                            <div>
                              <span className="text-gray-400">Nationality:</span>{' '}
                              <span className="font-semibold text-white">{member.nationality}</span>
                            </div>
                          )}
                          {member.date_of_birth && (
                            <div>
                              <span className="text-gray-400">Date of Birth:</span>{' '}
                              <span className="font-semibold text-white">{member.date_of_birth}</span>
                            </div>
                          )}
                          {member.flights_count !== null && member.flights_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Flights:</span>{' '}
                              <span className="font-semibold text-white">{member.flights_count}</span>
                            </div>
                          )}
                        </div>
                        {member.bio && (
                          <p className="text-sm text-gray-400 mt-3 leading-relaxed">{member.bio}</p>
                        )}
                        {member.wiki_url && (
                          <a 
                            href={member.wiki_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block"
                          >
                            Learn More →
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No crew information available.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'ROCKET' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold mb-3">Rocket Information</h4>
                  {rocket && (rocket.configuration || rocket.id || rocket.name || (typeof rocket === 'object' && Object.keys(rocket).length > 0)) ? (
                    <>
                      {rocket.configuration ? (
                        <div>
                          <h5 className="text-md font-semibold mb-3 text-gray-300">Rocket Configuration</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {/* Always show rocket ID if available */}
                          {rocket.id && (
                            <div>
                              <span className="text-gray-400">Rocket ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.id}</span>
                            </div>
                          )}
                          {/* Always show rocket name from configuration or top level */}
                          {(rocket.configuration.name || rocket.name) && (
                            <div>
                              <span className="text-gray-400">Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.name || rocket.name}</span>
                            </div>
                          )}
                          {rocket.configuration.id && (
                            <div>
                              <span className="text-gray-400">Configuration ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.id}</span>
                            </div>
                          )}
                          {rocket.configuration.full_name && (
                            <div>
                              <span className="text-gray-400">Full Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.full_name}</span>
                            </div>
                          )}
                          {rocket.configuration.url && (
                            <div>
                              <span className="text-gray-400">Configuration URL:</span>{' '}
                              <a 
                                href={rocket.configuration.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                              >
                                View Details
                              </a>
                            </div>
                          )}
                          {rocket.configuration.response_mode && (
                            <div>
                              <span className="text-gray-400">Response Mode:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.response_mode}</span>
                            </div>
                          )}
                          {rocket.configuration.manufacturer?.name && (
                            <div>
                              <span className="text-gray-400">Manufacturer:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.manufacturer.name}</span>
                            </div>
                          )}
                          {rocket.configuration.families && Array.isArray(rocket.configuration.families) && rocket.configuration.families.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Families:</span>
                              <div className="mt-2 space-y-2">
                                {rocket.configuration.families.map((family, idx) => (
                                  <div key={idx} className="border-b border-gray-800 pb-2 last:border-0">
                                    <div className="font-semibold text-white mb-1">{family.name || 'Unknown Family'}</div>
                                    {family.manufacturer && Array.isArray(family.manufacturer) && family.manufacturer.length > 0 && (
                                      <div className="ml-4 text-sm text-gray-300">
                                        <span className="text-gray-400">Manufacturers: </span>
                                        {family.manufacturer.map((m, mIdx) => (
                                          <span key={mIdx}>
                                            {m.name || m.abbrev || m}
                                            {mIdx < family.manufacturer.length - 1 ? ', ' : ''}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {family.parent && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Parent: {family.parent.name || family.parent}
                                      </div>
                                    )}
                                    {family.description && (
                                      <div className="ml-4 text-xs text-gray-400 mt-1">{family.description}</div>
                                    )}
                                    {family.active !== undefined && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Active: {family.active ? 'Yes' : 'No'}
                                      </div>
                                    )}
                                    {family.maiden_flight && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Maiden Flight: {family.maiden_flight}
                                      </div>
                                    )}
                                    {family.total_launch_count !== null && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Total Launches: {family.total_launch_count}
                                      </div>
                                    )}
                                    {family.successful_launches !== null && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Successful: {family.successful_launches}
                                      </div>
                                    )}
                                    {family.failed_launches !== null && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Failed: {family.failed_launches}
                                      </div>
                                    )}
                                    {family.consecutive_successful_launches !== null && (
                                      <div className="ml-4 text-xs text-gray-400">
                                        Consecutive Successful: {family.consecutive_successful_launches}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {!rocket.configuration.families && rocket.configuration.family && (
                            <div>
                              <span className="text-gray-400">Family:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.family}</span>
                            </div>
                          )}
                        {rocket.configuration.variant && (
                          <div>
                            <span className="text-gray-400">Variant:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.variant}</span>
                          </div>
                        )}
                        {rocket.configuration.length && (
                          <div>
                            <span className="text-gray-400">Length:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.length} m</span>
                          </div>
                        )}
                        {rocket.configuration.diameter && (
                          <div>
                            <span className="text-gray-400">Diameter:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.diameter} m</span>
                          </div>
                        )}
                        {rocket.configuration.maiden_flight && (
                          <div>
                            <span className="text-gray-400">Maiden Flight:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.maiden_flight}</span>
                          </div>
                        )}
                        {rocket.configuration.launch_cost && (
                          <div>
                            <span className="text-gray-400">Launch Cost:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.launch_cost}</span>
                          </div>
                        )}
                        {rocket.configuration.launch_mass && (
                          <div>
                            <span className="text-gray-400">Launch Mass:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.launch_mass} kg</span>
                          </div>
                        )}
                        {rocket.configuration.leo_capacity && (
                          <div>
                            <span className="text-gray-400">LEO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.leo_capacity} kg</span>
                          </div>
                        )}
                        {rocket.configuration.gto_capacity && (
                          <div>
                            <span className="text-gray-400">GTO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.gto_capacity} kg</span>
                          </div>
                        )}
                        {rocket.configuration.geo_capacity && (
                          <div>
                            <span className="text-gray-400">GEO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.geo_capacity} kg</span>
                          </div>
                        )}
                        {rocket.configuration.sso_capacity && (
                          <div>
                            <span className="text-gray-400">SSO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.sso_capacity} kg</span>
                          </div>
                        )}
                        {rocket.configuration.active !== undefined && (
                          <div>
                            <span className="text-gray-400">Active:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.active ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {rocket.configuration.is_placeholder !== undefined && (
                          <div>
                            <span className="text-gray-400">Is Placeholder:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.is_placeholder ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {rocket.configuration.fastest_turnaround && (
                          <div>
                            <span className="text-gray-400">Fastest Turnaround:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.fastest_turnaround}</span>
                          </div>
                        )}
                        {rocket.configuration.reusable !== null && rocket.configuration.reusable !== undefined && (
                          <div>
                            <span className="text-gray-400">Reusable:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.reusable ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {rocket.configuration.total_launch_count !== null && rocket.configuration.total_launch_count !== undefined && (
                          <div>
                            <span className="text-gray-400">Total Launches:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.total_launch_count}</span>
                          </div>
                        )}
                        {rocket.configuration.successful_launches !== null && rocket.configuration.successful_launches !== undefined && (
                          <div>
                            <span className="text-gray-400">Successful Launches:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.successful_launches}</span>
                          </div>
                        )}
                        {rocket.configuration.failed_launches !== null && rocket.configuration.failed_launches !== undefined && (
                          <div>
                            <span className="text-gray-400">Failed Launches:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.failed_launches}</span>
                          </div>
                        )}
                        {rocket.configuration.pending_launches !== null && rocket.configuration.pending_launches !== undefined && (
                          <div>
                            <span className="text-gray-400">Pending Launches:</span>{' '}
                            <span className="font-semibold text-yellow-500">{rocket.configuration.pending_launches}</span>
                          </div>
                        )}
                        {rocket.configuration.consecutive_successful_launches !== null && rocket.configuration.consecutive_successful_launches !== undefined && (
                          <div>
                            <span className="text-gray-400">Consecutive Successful:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.consecutive_successful_launches}</span>
                          </div>
                        )}
                        {/* Landing Statistics */}
                        {(rocket.configuration.attempted_landings !== null || rocket.configuration.successful_landings !== null || rocket.configuration.failed_landings !== null) && (
                          <div className="col-span-2 mt-2">
                            <h5 className="text-sm font-semibold text-gray-400 mb-2">Landing Statistics</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {rocket.configuration.attempted_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Attempted:</span>{' '}
                                  <span className="font-semibold text-white">{rocket.configuration.attempted_landings}</span>
                                </div>
                              )}
                              {rocket.configuration.successful_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Successful:</span>{' '}
                                  <span className="font-semibold text-green-500">{rocket.configuration.successful_landings}</span>
                                </div>
                              )}
                              {rocket.configuration.failed_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Failed:</span>{' '}
                                  <span className="font-semibold text-red-500">{rocket.configuration.failed_landings}</span>
                                </div>
                              )}
                              {rocket.configuration.consecutive_successful_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Consecutive Successful:</span>{' '}
                                  <span className="font-semibold text-white">{rocket.configuration.consecutive_successful_landings}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Program Array */}
                        {rocket.configuration.program && Array.isArray(rocket.configuration.program) && rocket.configuration.program.length > 0 && (
                          <div className="col-span-2 mt-2">
                            <h5 className="text-sm font-semibold text-gray-400 mb-2">Programs</h5>
                            <div className="space-y-2">
                              {rocket.configuration.program.map((prog, idx) => (
                                <div key={idx} className="text-sm text-gray-300">
                                  {prog.name || prog.id || 'Program'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {rocket.configuration.alias && (
                          <div>
                            <span className="text-gray-400">Alias:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.alias}</span>
                          </div>
                        )}
                        {rocket.configuration.min_stage !== null && (
                          <div>
                            <span className="text-gray-400">Min Stages:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.min_stage}</span>
                          </div>
                        )}
                        {rocket.configuration.max_stage !== null && (
                          <div>
                            <span className="text-gray-400">Max Stages:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.max_stage}</span>
                          </div>
                        )}
                        {rocket.configuration.to_thrust && (
                          <div>
                            <span className="text-gray-400">Thrust:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.to_thrust}</span>
                          </div>
                        )}
                        {rocket.configuration.apogee && (
                          <div>
                            <span className="text-gray-400">Apogee:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.apogee}</span>
                          </div>
                        )}
                        {rocket.configuration.vehicle_range && (
                          <div>
                            <span className="text-gray-400">Vehicle Range:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.vehicle_range}</span>
                          </div>
                        )}
                        {rocket.configuration.image_url && (
                          <div>
                            <span className="text-gray-400">Image:</span>{' '}
                            <a 
                              href={rocket.configuration.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                            >
                              View Image
                            </a>
                          </div>
                        )}
                      </div>
                      {rocket.configuration.description && (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-2">Description</h5>
                          <p className="text-sm text-gray-300 leading-relaxed">{rocket.configuration.description}</p>
                        </div>
                      )}
                      {(rocket.launcher_stage || rocket.spacecraft_stage) && (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-2">Stage Information</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {rocket.launcher_stage && (
                              <div>
                                <span className="text-gray-400">Launcher Stage:</span>{' '}
                                <span className="font-semibold text-white">
                                  {typeof rocket.launcher_stage === 'object' 
                                    ? JSON.stringify(rocket.launcher_stage) 
                                    : rocket.launcher_stage}
                                </span>
                              </div>
                            )}
                            {rocket.spacecraft_stage && (
                              <div>
                                <span className="text-gray-400">Spacecraft Stage:</span>{' '}
                                <span className="font-semibold text-white">
                                  {typeof rocket.spacecraft_stage === 'object' 
                                    ? JSON.stringify(rocket.spacecraft_stage) 
                                    : rocket.spacecraft_stage}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-4">
                        {rocket.configuration.url && (
                          <a 
                            href={rocket.configuration.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                          >
                            Configuration URL →
                          </a>
                        )}
                        {rocket.configuration.info_url && (
                          <a 
                            href={rocket.configuration.info_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                          >
                            More Information →
                          </a>
                        )}
                        {rocket.configuration.wiki_url && (
                          <a 
                            href={rocket.configuration.wiki_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                          >
                            Wikipedia →
                          </a>
                        )}
                      </div>
                    </div>
                      ) : (
                        /* Rocket-level fields (when configuration doesn't exist) */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {rocket.id && (
                            <div>
                              <span className="text-gray-400">Rocket ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.id}</span>
                            </div>
                          )}
                          {rocket.name && (
                            <div>
                              <span className="text-gray-400">Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.name}</span>
                            </div>
                          )}
                          {rocket.url && (
                            <div>
                              <span className="text-gray-400">URL:</span>{' '}
                              <a 
                                href={rocket.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                              >
                                View Details
                              </a>
                            </div>
                          )}
                          {rocket.response_mode && (
                            <div>
                              <span className="text-gray-400">Response Mode:</span>{' '}
                              <span className="font-semibold text-white">{rocket.response_mode}</span>
                            </div>
                          )}
                          {rocket.launcher_stage && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Launcher Stage:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof rocket.launcher_stage === 'object' 
                                  ? JSON.stringify(rocket.launcher_stage) 
                                  : rocket.launcher_stage}
                              </span>
                            </div>
                          )}
                          {rocket.spacecraft_stage && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Spacecraft Stage:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof rocket.spacecraft_stage === 'object' 
                                  ? JSON.stringify(rocket.spacecraft_stage) 
                                  : rocket.spacecraft_stage}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400">No rocket information available.</p>
                  )}
                </div>
              )}

              {activeTab === 'MISSION' && (
                <div className="space-y-6">
                  {mission && Object.keys(mission).length > 0 ? (
                    <>
                      {/* Mission Image */}
                      {mission.image?.image_url && (
                        <div className="mb-4">
                          <img 
                            src={mission.image.image_url} 
                            alt={mission.name || 'Mission Image'}
                            className="max-w-md h-auto rounded"
                          />
                          {mission.image.credit && (
                            <p className="text-xs text-gray-400 mt-1">Credit: {mission.image.credit}</p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {mission.id && (
                          <div>
                            <span className="text-gray-400">Mission ID:</span>{' '}
                            <span className="font-semibold text-white">{mission.id}</span>
                          </div>
                        )}
                        {mission.name && (
                          <div>
                            <span className="text-gray-400">Mission Name:</span>{' '}
                            <span className="font-semibold text-white">{mission.name}</span>
                          </div>
                        )}
                        {mission.type && (
                          <div>
                            <span className="text-gray-400">Mission Type:</span>{' '}
                            <span className="font-semibold text-white">{mission.type}</span>
                          </div>
                        )}
                        {mission.orbit?.id && (
                          <div>
                            <span className="text-gray-400">Orbit ID:</span>{' '}
                            <span className="font-semibold text-white">{mission.orbit.id}</span>
                          </div>
                        )}
                        {mission.orbit?.name && (
                          <div>
                            <span className="text-gray-400">Orbit Name:</span>{' '}
                            <span className="font-semibold text-white">{mission.orbit.name}</span>
                          </div>
                        )}
                        {mission.orbit?.abbrev && (
                          <div>
                            <span className="text-gray-400">Orbit Code:</span>{' '}
                            <span className="font-semibold text-white">{mission.orbit.abbrev}</span>
                          </div>
                        )}
                        {mission.orbit?.celestial_body && (
                          <>
                            {mission.orbit.celestial_body.name && (
                              <div>
                                <span className="text-gray-400">Celestial Body:</span>{' '}
                                <span className="font-semibold text-white">{mission.orbit.celestial_body.name}</span>
                              </div>
                            )}
                            {mission.orbit.celestial_body.type && (
                              <div>
                                <span className="text-gray-400">Body Type:</span>{' '}
                                <span className="font-semibold text-white">
                                  {typeof mission.orbit.celestial_body.type === 'object' 
                                    ? mission.orbit.celestial_body.type.name || mission.orbit.celestial_body.type 
                                    : mission.orbit.celestial_body.type}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {mission.description && (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-2">Mission Description</h5>
                          <p className="text-sm text-gray-300 leading-relaxed">{mission.description}</p>
                        </div>
                      )}

                      {mission.agencies && Array.isArray(mission.agencies) && mission.agencies.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-3">Mission Agencies</h5>
                          <div className="space-y-6">
                            {mission.agencies.map((agency, idx) => (
                              <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                                {/* Agency Logo/Image */}
                                {(agency.logo?.image_url || agency.image?.image_url) && (
                                  <div className="mb-3">
                                    {agency.logo?.image_url && (
                                      <div className="mb-2">
                                        <img 
                                          src={agency.logo.image_url} 
                                          alt={`${agency.name} Logo`}
                                          className="max-w-xs h-auto rounded"
                                        />
                                        {agency.logo.credit && (
                                          <p className="text-xs text-gray-400 mt-1">Credit: {agency.logo.credit}</p>
                                        )}
                                      </div>
                                    )}
                                    {agency.image?.image_url && (
                                      <div>
                                        <img 
                                          src={agency.image.image_url} 
                                          alt={`${agency.name} Image`}
                                          className="max-w-xs h-auto rounded"
                                        />
                                        {agency.image.credit && (
                                          <p className="text-xs text-gray-400 mt-1">Credit: {agency.image.credit}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  {agency.id && (
                                    <div>
                                      <span className="text-gray-400">Agency ID:</span>{' '}
                                      <span className="font-semibold text-white">{agency.id}</span>
                                    </div>
                                  )}
                                  {agency.name && (
                                    <div>
                                      <span className="text-gray-400">Name:</span>{' '}
                                      <span className="font-semibold text-white">{agency.name}</span>
                                    </div>
                                  )}
                                  {agency.abbrev && (
                                    <div>
                                      <span className="text-gray-400">Abbreviation:</span>{' '}
                                      <span className="font-semibold text-white">{agency.abbrev}</span>
                                    </div>
                                  )}
                                  {agency.type && (
                                    <div>
                                      <span className="text-gray-400">Type:</span>{' '}
                                      <span className="font-semibold text-white">
                                        {typeof agency.type === 'object' 
                                          ? agency.type.name || agency.type 
                                          : agency.type}
                                      </span>
                                    </div>
                                  )}
                                  {agency.country && Array.isArray(agency.country) && agency.country.length > 0 && (
                                    <div>
                                      <span className="text-gray-400">Country:</span>{' '}
                                      <span className="font-semibold text-white">
                                        {agency.country.map(c => c.name || c.alpha_2_code || c).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {agency.founding_year && (
                                    <div>
                                      <span className="text-gray-400">Founded:</span>{' '}
                                      <span className="font-semibold text-white">{agency.founding_year}</span>
                                    </div>
                                  )}
                                  {agency.administrator && (
                                    <div>
                                      <span className="text-gray-400">Administrator:</span>{' '}
                                      <span className="font-semibold text-white">{agency.administrator}</span>
                                    </div>
                                  )}
                                  {agency.launchers && (
                                    <div>
                                      <span className="text-gray-400">Launchers:</span>{' '}
                                      <span className="font-semibold text-white">{agency.launchers}</span>
                                    </div>
                                  )}
                                  {agency.spacecraft && (
                                    <div>
                                      <span className="text-gray-400">Spacecraft:</span>{' '}
                                      <span className="font-semibold text-white">{agency.spacecraft}</span>
                                    </div>
                                  )}
                                  {agency.featured !== undefined && (
                                    <div>
                                      <span className="text-gray-400">Featured:</span>{' '}
                                      <span className="font-semibold text-white">{agency.featured ? 'Yes' : 'No'}</span>
                                    </div>
                                  )}
                                  {agency.response_mode && (
                                    <div>
                                      <span className="text-gray-400">Response Mode:</span>{' '}
                                      <span className="font-semibold text-white">{agency.response_mode}</span>
                                    </div>
                                  )}
                                  {agency.parent && (
                                    <div>
                                      <span className="text-gray-400">Parent Agency:</span>{' '}
                                      <span className="font-semibold text-white">
                                        {typeof agency.parent === 'object' 
                                          ? agency.parent.name || agency.parent.abbrev || 'N/A'
                                          : agency.parent}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Agency Statistics */}
                                {(agency.total_launch_count !== null || agency.successful_launches !== null || agency.failed_launches !== null) && (
                                  <div className="mt-3">
                                    <h6 className="text-sm font-bold mb-2">Statistics</h6>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {agency.total_launch_count !== null && (
                                        <div>
                                          <span className="text-gray-400">Total Launches:</span>{' '}
                                          <span className="font-semibold text-white">{agency.total_launch_count}</span>
                                        </div>
                                      )}
                                      {agency.successful_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Successful:</span>{' '}
                                          <span className="font-semibold text-green-500">{agency.successful_launches}</span>
                                        </div>
                                      )}
                                      {agency.failed_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Failed:</span>{' '}
                                          <span className="font-semibold text-red-500">{agency.failed_launches}</span>
                                        </div>
                                      )}
                                      {agency.pending_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Pending:</span>{' '}
                                          <span className="font-semibold text-yellow-500">{agency.pending_launches}</span>
                                        </div>
                                      )}
                                      {agency.consecutive_successful_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Consecutive Successful:</span>{' '}
                                          <span className="font-semibold text-white">{agency.consecutive_successful_launches}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {agency.description && (
                                  <p className="text-sm text-gray-300 mt-3 leading-relaxed">{agency.description}</p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-4">
                                  {agency.url && (
                                    <a 
                                      href={agency.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                                    >
                                      Agency URL →
                                    </a>
                                  )}
                                  {agency.info_url && (
                                    <a 
                                      href={agency.info_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                                    >
                                      More Information →
                                    </a>
                                  )}
                                  {agency.wiki_url && (
                                    <a 
                                      href={agency.wiki_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                                    >
                                      Wikipedia →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {((launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0) || 
                       (mission.info_urls && Array.isArray(mission.info_urls) && mission.info_urls.length > 0)) ? (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-3">Mission Information URLs</h5>
                          <div className="space-y-4">
                            {[
                              ...(launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0 ? launch.info_urls : []),
                              ...(mission.info_urls && Array.isArray(mission.info_urls) && mission.info_urls.length > 0 ? mission.info_urls : [])
                            ].map((urlObj, idx) => {
                              const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                              const title = typeof urlObj === 'object' ? urlObj.title : null;
                              const description = typeof urlObj === 'object' ? urlObj.description : null;
                              const source = typeof urlObj === 'object' ? urlObj.source : null;
                              const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                              const type = typeof urlObj === 'object' ? urlObj.type : null;
                              const language = typeof urlObj === 'object' ? urlObj.language : null;
                              
                              return (
                                <div key={idx} className="border-b border-gray-800 pb-3 last:border-0">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-[#8B1A1A] hover:text-[#A02A2A] underline font-semibold mb-1"
                                  >
                                    {title || url}
                                  </a>
                                  {description && (
                                    <p className="text-sm text-gray-300 mb-1">{description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                                    {source && <span>Source: {source}</span>}
                                    {priority !== null && priority !== undefined && <span>Priority: {priority}</span>}
                                    {type?.name && <span>Type: {type.name}</span>}
                                    {language?.name && <span>Language: {language.name}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {((launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0) || 
                       (mission.vid_urls && Array.isArray(mission.vid_urls) && mission.vid_urls.length > 0)) ? (
                        <div className="mt-4">
                          <h5 className="text-md font-bold mb-3">Mission Video URLs</h5>
                          <div className="space-y-4">
                            {[
                              ...(launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0 ? launch.vid_urls : []),
                              ...(mission.vid_urls && Array.isArray(mission.vid_urls) && mission.vid_urls.length > 0 ? mission.vid_urls : [])
                            ].map((urlObj, idx) => {
                              const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                              const title = typeof urlObj === 'object' ? urlObj.title : null;
                              const description = typeof urlObj === 'object' ? urlObj.description : null;
                              const publisher = typeof urlObj === 'object' ? urlObj.publisher : null;
                              const source = typeof urlObj === 'object' ? urlObj.source : null;
                              const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                              const type = typeof urlObj === 'object' ? urlObj.type : null;
                              const language = typeof urlObj === 'object' ? urlObj.language : null;
                              const startTime = typeof urlObj === 'object' ? urlObj.start_time : null;
                              const endTime = typeof urlObj === 'object' ? urlObj.end_time : null;
                              const live = typeof urlObj === 'object' ? urlObj.live : false;
                              
                              return (
                                <div key={idx} className="border-b border-gray-800 pb-3 last:border-0">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-[#8B1A1A] hover:text-[#A02A2A] underline font-semibold mb-1"
                                  >
                                    {title || url}
                                  </a>
                                  {description && (
                                    <p className="text-sm text-gray-300 mb-1">{description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                                    {publisher && <span>Publisher: {publisher}</span>}
                                    {source && <span>Source: {source}</span>}
                                    {priority !== null && priority !== undefined && <span>Priority: {priority}</span>}
                                    {type?.name && <span>Type: {type.name}</span>}
                                    {language?.name && <span>Language: {language.name}</span>}
                                    {startTime && <span>Start: {new Date(startTime).toLocaleString()}</span>}
                                    {endTime && <span>End: {new Date(endTime).toLocaleString()}</span>}
                                    {live && <span className="text-red-500">LIVE</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-gray-400">No mission information available.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'LAUNCH SERVICE PROVIDER' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold mb-3">Launch Service Provider</h4>
                    {launchServiceProvider && Object.keys(launchServiceProvider).length > 0 ? (
                      <>
                        {/* Logo/Image/Social Logo Display */}
                        {(launchServiceProvider.logo?.image_url || launchServiceProvider.image?.image_url || launchServiceProvider.social_logo?.image_url) && (
                          <div className="mb-4">
                            {launchServiceProvider.logo?.image_url && (
                              <div className="mb-2">
                                <h5 className="text-sm font-semibold text-gray-400 mb-1">Logo</h5>
                                <img 
                                  src={launchServiceProvider.logo.image_url} 
                                  alt={`${launchServiceProvider.name} Logo`}
                                  className="max-w-xs h-auto rounded"
                                />
                                {launchServiceProvider.logo.credit && (
                                  <p className="text-xs text-gray-400 mt-1">Credit: {launchServiceProvider.logo.credit}</p>
                                )}
                              </div>
                            )}
                            {launchServiceProvider.image?.image_url && (
                              <div className="mb-2">
                                <h5 className="text-sm font-semibold text-gray-400 mb-1">Image</h5>
                                <img 
                                  src={launchServiceProvider.image.image_url} 
                                  alt={`${launchServiceProvider.name} Image`}
                                  className="max-w-xs h-auto rounded"
                                />
                                {launchServiceProvider.image.credit && (
                                  <p className="text-xs text-gray-400 mt-1">Credit: {launchServiceProvider.image.credit}</p>
                                )}
                              </div>
                            )}
                            {launchServiceProvider.social_logo?.image_url && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-400 mb-1">Social Logo</h5>
                                <img 
                                  src={launchServiceProvider.social_logo.image_url} 
                                  alt={`${launchServiceProvider.name} Social Logo`}
                                  className="max-w-xs h-auto rounded"
                                />
                                {launchServiceProvider.social_logo.credit && (
                                  <p className="text-xs text-gray-400 mt-1">Credit: {launchServiceProvider.social_logo.credit}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {launchServiceProvider.id && (
                            <div>
                              <span className="text-gray-400">ID:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.id}</span>
                            </div>
                          )}
                          {launchServiceProvider.name && (
                            <div>
                              <span className="text-gray-400">Name:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.name}</span>
                            </div>
                          )}
                          {launchServiceProvider.abbrev && (
                            <div>
                              <span className="text-gray-400">Abbreviation:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.abbrev}</span>
                            </div>
                          )}
                          {launchServiceProvider.type && (
                            <div>
                              <span className="text-gray-400">Type:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof launchServiceProvider.type === 'object' 
                                  ? launchServiceProvider.type.name || launchServiceProvider.type 
                                  : launchServiceProvider.type}
                              </span>
                            </div>
                          )}
                          {launchServiceProvider.country && Array.isArray(launchServiceProvider.country) && launchServiceProvider.country.length > 0 && (
                            <div>
                              <span className="text-gray-400">Country:</span>{' '}
                              <span className="font-semibold text-white">
                                {launchServiceProvider.country.map(c => c.name || c.alpha_2_code || c).join(', ')}
                              </span>
                            </div>
                          )}
                          {!launchServiceProvider.country && launchServiceProvider.country_code && (
                            <div>
                              <span className="text-gray-400">Country Code:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.country_code}</span>
                            </div>
                          )}
                          {launchServiceProvider.founding_year && (
                            <div>
                              <span className="text-gray-400">Founded:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.founding_year}</span>
                            </div>
                          )}
                          {launchServiceProvider.administrator && (
                            <div>
                              <span className="text-gray-400">Administrator:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.administrator}</span>
                            </div>
                          )}
                          {launchServiceProvider.launchers && (
                            <div>
                              <span className="text-gray-400">Launchers:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.launchers}</span>
                            </div>
                          )}
                          {launchServiceProvider.spacecraft && (
                            <div>
                              <span className="text-gray-400">Spacecraft:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.spacecraft}</span>
                            </div>
                          )}
                          {launchServiceProvider.featured !== undefined && (
                            <div>
                              <span className="text-gray-400">Featured:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.featured ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {launchServiceProvider.response_mode && (
                            <div>
                              <span className="text-gray-400">Response Mode:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.response_mode}</span>
                            </div>
                          )}
                          {launchServiceProvider.parent && (
                            <div>
                              <span className="text-gray-400">Parent Agency:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof launchServiceProvider.parent === 'object' 
                                  ? launchServiceProvider.parent.name || launchServiceProvider.parent.abbrev || 'N/A'
                                  : launchServiceProvider.parent}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        {(launchServiceProvider.total_launch_count !== null || launchServiceProvider.successful_launches !== null || launchServiceProvider.failed_launches !== null) && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">Launch Statistics</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              {launchServiceProvider.total_launch_count !== null && (
                                <div>
                                  <span className="text-gray-400">Total Launches:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.total_launch_count}</span>
                                </div>
                              )}
                              {launchServiceProvider.successful_launches !== null && (
                                <div>
                                  <span className="text-gray-400">Successful Launches:</span>{' '}
                                  <span className="font-semibold text-green-500">{launchServiceProvider.successful_launches}</span>
                                </div>
                              )}
                              {launchServiceProvider.failed_launches !== null && (
                                <div>
                                  <span className="text-gray-400">Failed Launches:</span>{' '}
                                  <span className="font-semibold text-red-500">{launchServiceProvider.failed_launches}</span>
                                </div>
                              )}
                              {launchServiceProvider.pending_launches !== null && (
                                <div>
                                  <span className="text-gray-400">Pending Launches:</span>{' '}
                                  <span className="font-semibold text-yellow-500">{launchServiceProvider.pending_launches}</span>
                                </div>
                              )}
                              {launchServiceProvider.consecutive_successful_launches !== null && (
                                <div>
                                  <span className="text-gray-400">Consecutive Successful:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.consecutive_successful_launches}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Landing Statistics */}
                        {(launchServiceProvider.successful_landings !== null || launchServiceProvider.failed_landings !== null || launchServiceProvider.attempted_landings !== null) && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">Landing Statistics</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              {launchServiceProvider.attempted_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Attempted Landings:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.attempted_landings}</span>
                                </div>
                              )}
                              {launchServiceProvider.successful_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Successful Landings:</span>{' '}
                                  <span className="font-semibold text-green-500">{launchServiceProvider.successful_landings}</span>
                                </div>
                              )}
                              {launchServiceProvider.failed_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Failed Landings:</span>{' '}
                                  <span className="font-semibold text-red-500">{launchServiceProvider.failed_landings}</span>
                                </div>
                              )}
                              {launchServiceProvider.consecutive_successful_landings !== null && (
                                <div>
                                  <span className="text-gray-400">Consecutive Successful Landings:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.consecutive_successful_landings}</span>
                                </div>
                              )}
                              {launchServiceProvider.successful_landings_spacecraft !== null && (
                                <div>
                                  <span className="text-gray-400">Successful Spacecraft Landings:</span>{' '}
                                  <span className="font-semibold text-green-500">{launchServiceProvider.successful_landings_spacecraft}</span>
                                </div>
                              )}
                              {launchServiceProvider.failed_landings_spacecraft !== null && (
                                <div>
                                  <span className="text-gray-400">Failed Spacecraft Landings:</span>{' '}
                                  <span className="font-semibold text-red-500">{launchServiceProvider.failed_landings_spacecraft}</span>
                                </div>
                              )}
                              {launchServiceProvider.attempted_landings_spacecraft !== null && (
                                <div>
                                  <span className="text-gray-400">Attempted Spacecraft Landings:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.attempted_landings_spacecraft}</span>
                                </div>
                              )}
                              {launchServiceProvider.successful_landings_payload !== null && (
                                <div>
                                  <span className="text-gray-400">Successful Payload Landings:</span>{' '}
                                  <span className="font-semibold text-green-500">{launchServiceProvider.successful_landings_payload}</span>
                                </div>
                              )}
                              {launchServiceProvider.failed_landings_payload !== null && (
                                <div>
                                  <span className="text-gray-400">Failed Payload Landings:</span>{' '}
                                  <span className="font-semibold text-red-500">{launchServiceProvider.failed_landings_payload}</span>
                                </div>
                              )}
                              {launchServiceProvider.attempted_landings_payload !== null && (
                                <div>
                                  <span className="text-gray-400">Attempted Payload Landings:</span>{' '}
                                  <span className="font-semibold text-white">{launchServiceProvider.attempted_landings_payload}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {launchServiceProvider.description && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">Description</h5>
                            <p className="text-sm text-gray-300 leading-relaxed">{launchServiceProvider.description}</p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          {launchServiceProvider.url && (
                            <a 
                              href={launchServiceProvider.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              Provider URL →
                            </a>
                          )}
                          {launchServiceProvider.info_url && (
                            <a 
                              href={launchServiceProvider.info_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              More Information →
                            </a>
                          )}
                          {launchServiceProvider.wiki_url && (
                            <a 
                              href={launchServiceProvider.wiki_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              Wikipedia →
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400">No launch service provider information available.</p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'PAD' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold mb-3">Launch Pad Information</h4>
                    {pad && Object.keys(pad).length > 0 ? (
                      <>
                        {/* Pad Image */}
                        {pad.image?.image_url && (
                          <div className="mb-4">
                            <img 
                              src={pad.image.image_url} 
                              alt={pad.name || 'Pad Image'}
                              className="max-w-md h-auto rounded"
                            />
                            {pad.image.credit && (
                              <p className="text-xs text-gray-400 mt-1">Credit: {pad.image.credit}</p>
                            )}
                            {pad.image.thumbnail_url && (
                              <div className="mt-2">
                                <img 
                                  src={pad.image.thumbnail_url} 
                                  alt={`${pad.name} Thumbnail`}
                                  className="max-w-xs h-auto rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {pad.id && (
                            <div>
                              <span className="text-gray-400">Pad ID:</span>{' '}
                              <span className="font-semibold text-white">{pad.id}</span>
                            </div>
                          )}
                          {pad.name && (
                            <div>
                              <span className="text-gray-400">Pad Name:</span>{' '}
                              <span className="font-semibold text-white">{pad.name}</span>
                            </div>
                          )}
                          {pad.url && (
                            <div>
                              <span className="text-gray-400">Pad URL:</span>{' '}
                              <a 
                                href={pad.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                              >
                                View Details
                              </a>
                            </div>
                          )}
                          {pad.active !== undefined && (
                            <div>
                              <span className="text-gray-400">Active:</span>{' '}
                              <span className={`font-semibold ${pad.active ? 'text-green-500' : 'text-red-500'}`}>
                                {pad.active ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                          {pad.agency_id && (
                            <div>
                              <span className="text-gray-400">Agency ID:</span>{' '}
                              <span className="font-semibold text-white">{pad.agency_id}</span>
                            </div>
                          )}
                          {pad.country?.alpha_2_code && (
                            <div>
                              <span className="text-gray-400">Country Code:</span>{' '}
                              <span className="font-semibold text-white">{pad.country.alpha_2_code}</span>
                            </div>
                          )}
                          {!pad.country?.alpha_2_code && pad.country_code && (
                            <div>
                              <span className="text-gray-400">Country Code:</span>{' '}
                              <span className="font-semibold text-white">{pad.country_code}</span>
                            </div>
                          )}
                          {pad.country?.name && (
                            <div>
                              <span className="text-gray-400">Country:</span>{' '}
                              <span className="font-semibold text-white">{pad.country.name}</span>
                            </div>
                          )}
                          {pad.latitude && pad.longitude && (
                            <div>
                              <span className="text-gray-400">Coordinates:</span>{' '}
                              <span className="font-semibold text-white">
                                {pad.latitude}, {pad.longitude}
                              </span>
                            </div>
                          )}
                          {pad.total_launch_count !== null && pad.total_launch_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Total Launches:</span>{' '}
                              <span className="font-semibold text-white">{pad.total_launch_count}</span>
                            </div>
                          )}
                          {pad.orbital_launch_attempt_count !== null && pad.orbital_launch_attempt_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Orbital Launch Attempts:</span>{' '}
                              <span className="font-semibold text-white">{pad.orbital_launch_attempt_count}</span>
                            </div>
                          )}
                          {pad.fastest_turnaround && (
                            <div>
                              <span className="text-gray-400">Fastest Turnaround:</span>{' '}
                              <span className="font-semibold text-white">{pad.fastest_turnaround}</span>
                            </div>
                          )}
                        </div>

                        {pad.description && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">Description</h5>
                            <p className="text-sm text-gray-300 leading-relaxed">{pad.description}</p>
                          </div>
                        )}

                        {/* Pad Agencies */}
                        {pad.agencies && Array.isArray(pad.agencies) && pad.agencies.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-3">Pad Agencies</h5>
                            <div className="space-y-4">
                              {pad.agencies.map((agency, idx) => (
                                <div key={idx} className="border-b border-gray-800 pb-3 last:border-0">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    {agency.id && (
                                      <div>
                                        <span className="text-gray-400">Agency ID:</span>{' '}
                                        <span className="font-semibold text-white">{agency.id}</span>
                                      </div>
                                    )}
                                    {agency.name && (
                                      <div>
                                        <span className="text-gray-400">Name:</span>{' '}
                                        <span className="font-semibold text-white">{agency.name}</span>
                                      </div>
                                    )}
                                    {agency.abbrev && (
                                      <div>
                                        <span className="text-gray-400">Abbreviation:</span>{' '}
                                        <span className="font-semibold text-white">{agency.abbrev}</span>
                                      </div>
                                    )}
                                    {agency.type && (
                                      <div>
                                        <span className="text-gray-400">Type:</span>{' '}
                                        <span className="font-semibold text-white">
                                          {typeof agency.type === 'object' 
                                            ? agency.type.name || agency.type 
                                            : agency.type}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {agency.url && (
                                    <a 
                                      href={agency.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block"
                                    >
                                      Agency URL →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Location Information */}
                        {pad.location && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-3">Location Information</h5>
                            
                            {/* Location Image */}
                            {pad.location.image?.image_url && (
                              <div className="mb-3">
                                <img 
                                  src={pad.location.image.image_url} 
                                  alt={pad.location.name || 'Location Image'}
                                  className="max-w-md h-auto rounded"
                                />
                                {pad.location.image.credit && (
                                  <p className="text-xs text-gray-400 mt-1">Credit: {pad.location.image.credit}</p>
                                )}
                                {pad.location.image.thumbnail_url && (
                                  <div className="mt-2">
                                    <img 
                                      src={pad.location.image.thumbnail_url} 
                                      alt={`${pad.location.name} Thumbnail`}
                                      className="max-w-xs h-auto rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              {pad.location.id && (
                                <div>
                                  <span className="text-gray-400">Location ID:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.id}</span>
                                </div>
                              )}
                              {pad.location.name && (
                                <div>
                                  <span className="text-gray-400">Location Name:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.name}</span>
                                </div>
                              )}
                              {pad.location.url && (
                                <div>
                                  <span className="text-gray-400">Location URL:</span>{' '}
                                  <a 
                                    href={pad.location.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                                  >
                                    View Details
                                  </a>
                                </div>
                              )}
                              {pad.location.active !== undefined && (
                                <div>
                                  <span className="text-gray-400">Active:</span>{' '}
                                  <span className={`font-semibold ${pad.location.active ? 'text-green-500' : 'text-red-500'}`}>
                                    {pad.location.active ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              )}
                              {pad.location.country?.name && (
                                <div>
                                  <span className="text-gray-400">Country:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.country.name}</span>
                                </div>
                              )}
                              {pad.location.country?.alpha_2_code && (
                                <div>
                                  <span className="text-gray-400">Country Code:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.country.alpha_2_code}</span>
                                </div>
                              )}
                              {pad.location.latitude && pad.location.longitude && (
                                <div>
                                  <span className="text-gray-400">Coordinates:</span>{' '}
                                  <span className="font-semibold text-white">
                                    {pad.location.latitude}, {pad.location.longitude}
                                  </span>
                                </div>
                              )}
                              {pad.location.timezone_name && (
                                <div>
                                  <span className="text-gray-400">Timezone:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.timezone_name}</span>
                                </div>
                              )}
                              {pad.location.total_launch_count !== null && pad.location.total_launch_count !== undefined && (
                                <div>
                                  <span className="text-gray-400">Total Launches:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.total_launch_count}</span>
                                </div>
                              )}
                              {pad.location.total_landing_count !== null && pad.location.total_landing_count !== undefined && (
                                <div>
                                  <span className="text-gray-400">Total Landings:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.total_landing_count}</span>
                                </div>
                              )}
                              {pad.location.response_mode && (
                                <div>
                                  <span className="text-gray-400">Response Mode:</span>{' '}
                                  <span className="font-semibold text-white">{pad.location.response_mode}</span>
                                </div>
                              )}
                            </div>

                            {/* Celestial Body */}
                            {pad.location.celestial_body && (
                              <div className="mt-3">
                                <h6 className="text-sm font-bold mb-2">Celestial Body</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  {pad.location.celestial_body.name && (
                                    <div>
                                      <span className="text-gray-400">Name:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.name}</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.type && (
                                    <div>
                                      <span className="text-gray-400">Type:</span>{' '}
                                      <span className="font-semibold text-white">
                                        {typeof pad.location.celestial_body.type === 'object' 
                                          ? pad.location.celestial_body.type.name || pad.location.celestial_body.type 
                                          : pad.location.celestial_body.type}
                                      </span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.mass && (
                                    <div>
                                      <span className="text-gray-400">Mass:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.mass.toExponential(2)} kg</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.diameter && (
                                    <div>
                                      <span className="text-gray-400">Diameter:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.diameter.toLocaleString()} m</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.gravity && (
                                    <div>
                                      <span className="text-gray-400">Gravity:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.gravity} m/s²</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.atmosphere !== undefined && (
                                    <div>
                                      <span className="text-gray-400">Atmosphere:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.atmosphere ? 'Yes' : 'No'}</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.length_of_day && (
                                    <div>
                                      <span className="text-gray-400">Length of Day:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.length_of_day}</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.wiki_url && (
                                    <div>
                                      <span className="text-gray-400">Wikipedia:</span>{' '}
                                      <a 
                                        href={pad.location.celestial_body.wiki_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[#8B1A1A] hover:text-[#A02A2A] underline"
                                      >
                                        View
                                      </a>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.id && (
                                    <div>
                                      <span className="text-gray-400">Celestial Body ID:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.id}</span>
                                    </div>
                                  )}
                                  {pad.location.celestial_body.response_mode && (
                                    <div>
                                      <span className="text-gray-400">Response Mode:</span>{' '}
                                      <span className="font-semibold text-white">{pad.location.celestial_body.response_mode}</span>
                                    </div>
                                  )}
                                </div>
                                {pad.location.celestial_body.description && (
                                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">{pad.location.celestial_body.description}</p>
                                )}
                                {pad.location.celestial_body.image?.image_url && (
                                  <div className="mt-2">
                                    <img 
                                      src={pad.location.celestial_body.image.image_url} 
                                      alt={pad.location.celestial_body.name || 'Celestial Body Image'}
                                      className="max-w-xs h-auto rounded"
                                    />
                                    {pad.location.celestial_body.image.credit && (
                                      <p className="text-xs text-gray-400 mt-1">Credit: {pad.location.celestial_body.image.credit}</p>
                                    )}
                                  </div>
                                )}
                                {/* Celestial Body Statistics */}
                                {(pad.location.celestial_body.total_attempted_launches !== null || 
                                  pad.location.celestial_body.successful_launches !== null || 
                                  pad.location.celestial_body.failed_launches !== null) && (
                                  <div className="mt-3">
                                    <h6 className="text-sm font-bold mb-2">Celestial Body Launch Statistics</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                      {pad.location.celestial_body.total_attempted_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Total Attempted Launches:</span>{' '}
                                          <span className="font-semibold text-white">{pad.location.celestial_body.total_attempted_launches}</span>
                                        </div>
                                      )}
                                      {pad.location.celestial_body.successful_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Successful Launches:</span>{' '}
                                          <span className="font-semibold text-green-500">{pad.location.celestial_body.successful_launches}</span>
                                        </div>
                                      )}
                                      {pad.location.celestial_body.failed_launches !== null && (
                                        <div>
                                          <span className="text-gray-400">Failed Launches:</span>{' '}
                                          <span className="font-semibold text-red-500">{pad.location.celestial_body.failed_launches}</span>
                                        </div>
                                      )}
                                      {pad.location.celestial_body.total_attempted_landings !== null && (
                                        <div>
                                          <span className="text-gray-400">Total Attempted Landings:</span>{' '}
                                          <span className="font-semibold text-white">{pad.location.celestial_body.total_attempted_landings}</span>
                                        </div>
                                      )}
                                      {pad.location.celestial_body.successful_landings !== null && (
                                        <div>
                                          <span className="text-gray-400">Successful Landings:</span>{' '}
                                          <span className="font-semibold text-green-500">{pad.location.celestial_body.successful_landings}</span>
                                        </div>
                                      )}
                                      {pad.location.celestial_body.failed_landings !== null && (
                                        <div>
                                          <span className="text-gray-400">Failed Landings:</span>{' '}
                                          <span className="font-semibold text-red-500">{pad.location.celestial_body.failed_landings}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {pad.location.description && (
                              <p className="text-sm text-gray-300 mt-3 leading-relaxed">{pad.location.description}</p>
                            )}

                            {pad.location.map_image && (
                              <div className="mt-3">
                                <h6 className="text-sm font-bold mb-2">Map Image</h6>
                                <img 
                                  src={pad.location.map_image} 
                                  alt={`${pad.location.name} Map`}
                                  className="max-w-md h-auto rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Map Image */}
                        {pad.map_image && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">Pad Map Image</h5>
                            <img 
                              src={pad.map_image} 
                              alt={`${pad.name} Map`}
                              className="max-w-md h-auto rounded"
                            />
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          {pad.url && (
                            <a 
                              href={pad.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              Pad URL →
                            </a>
                          )}
                          {pad.info_url && (
                            <a 
                              href={pad.info_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              More Information →
                            </a>
                          )}
                          {pad.wiki_url && (
                            <a 
                              href={pad.wiki_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              Wikipedia →
                            </a>
                          )}
                          {pad.map_url && (
                            <a 
                              href={pad.map_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm underline"
                            >
                              Map →
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400">No launch pad information available.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'RECOVERY' && (
                <div className="space-y-4">
                  {launch.recovery ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {launch.recovery.landing_location && (
                          <div>
                            <span className="text-gray-400">Landing Location:</span>{' '}
                            <span className="font-semibold text-white">{launch.recovery.landing_location}</span>
                          </div>
                        )}
                        {launch.recovery.landing_type && (
                          <div>
                            <span className="text-gray-400">Landing Type:</span>{' '}
                            <span className="font-semibold text-white">{launch.recovery.landing_type}</span>
                          </div>
                        )}
                        {launch.recovery.landed !== null && launch.recovery.landed !== undefined && (
                          <div>
                            <span className="text-gray-400">Landed:</span>{' '}
                            <span className={`font-semibold ${launch.recovery.landed ? 'text-green-500' : 'text-red-500'}`}>
                              {launch.recovery.landed ? 'Yes' : 'No'}
                            </span>
                          </div>
                        )}
                        {launch.recovery.landing_attempt !== null && launch.recovery.landing_attempt !== undefined && (
                          <div>
                            <span className="text-gray-400">Landing Attempt:</span>{' '}
                            <span className="font-semibold text-white">{launch.recovery.landing_attempt ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">No recovery information available.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'HAZARDS' && (
                <div className="space-y-4">
                  {launch.hazards && launch.hazards.length > 0 ? (
                    launch.hazards.map((hazard, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-2 text-yellow-500">{hazard.name || 'Hazard'}</h4>
                        {hazard.description && (
                          <p className="text-sm text-gray-300 leading-relaxed">{hazard.description}</p>
                        )}
                        {hazard.severity && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">Severity: </span>
                            <span className="font-semibold text-white">{hazard.severity}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No hazard information available.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'STATISTICS' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold mb-4">Launch Statistics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {launch.orbital_launch_attempt_count !== null && launch.orbital_launch_attempt_count !== undefined && (
                        <div>
                          <span className="text-gray-400">Orbital Launch Attempt Count:</span>{' '}
                          <span className="font-semibold text-white">{launch.orbital_launch_attempt_count}</span>
                        </div>
                      )}
                      {launch.location_launch_attempt_count !== null && launch.location_launch_attempt_count !== undefined && (
                        <div>
                          <span className="text-gray-400">Location Launch Attempt Count:</span>{' '}
                          <span className="font-semibold text-white">{launch.location_launch_attempt_count}</span>
                        </div>
                      )}
                      {launch.pad_launch_attempt_count !== null && launch.pad_launch_attempt_count !== undefined && (
                        <div>
                          <span className="text-gray-400">Pad Launch Attempt Count:</span>{' '}
                          <span className="font-semibold text-white">{launch.pad_launch_attempt_count}</span>
                        </div>
                      )}
                      {launch.agency_launch_attempt_count !== null && launch.agency_launch_attempt_count !== undefined && (
                        <div>
                          <span className="text-gray-400">Agency Launch Attempt Count:</span>{' '}
                          <span className="font-semibold text-white">{launch.agency_launch_attempt_count}</span>
                        </div>
                      )}
                      {launch.orbital_launch_attempt_count_year !== null && launch.orbital_launch_attempt_count_year !== undefined && (
                        <div>
                          <span className="text-gray-400">Orbital Launches This Year:</span>{' '}
                          <span className="font-semibold text-white">{launch.orbital_launch_attempt_count_year}</span>
                        </div>
                      )}
                      {launch.location_launch_attempt_count_year !== null && launch.location_launch_attempt_count_year !== undefined && (
                        <div>
                          <span className="text-gray-400">Location Launches This Year:</span>{' '}
                          <span className="font-semibold text-white">{launch.location_launch_attempt_count_year}</span>
                        </div>
                      )}
                      {launch.pad_launch_attempt_count_year !== null && launch.pad_launch_attempt_count_year !== undefined && (
                        <div>
                          <span className="text-gray-400">Pad Launches This Year:</span>{' '}
                          <span className="font-semibold text-white">{launch.pad_launch_attempt_count_year}</span>
                        </div>
                      )}
                      {launch.agency_launch_attempt_count_year !== null && launch.agency_launch_attempt_count_year !== undefined && (
                        <div>
                          <span className="text-gray-400">Agency Launches This Year:</span>{' '}
                          <span className="font-semibold text-white">{launch.agency_launch_attempt_count_year}</span>
                        </div>
                      )}
                      {launch.pad_turnaround && (
                        <div>
                          <span className="text-gray-400">Pad Turnaround:</span>{' '}
                          <span className="font-semibold text-white">{launch.pad_turnaround}</span>
                        </div>
                      )}
                    </div>
                </div>
              )}

              {activeTab === 'UPDATES' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold mb-3">Launch Updates</h4>
                  {launch.updates && Array.isArray(launch.updates) && launch.updates.length > 0 ? (
                    launch.updates.map((update, idx) => (
                      <div key={update.id || idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <div className="flex items-start gap-4 mb-2">
                          {update.profile_image && (
                            <img 
                              src={update.profile_image} 
                              alt={update.created_by || 'Profile'} 
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                {update.created_by && (
                                  <div className="text-sm font-semibold text-white mb-1">{update.created_by}</div>
                                )}
                                {update.created_on && (
                                  <span className="text-xs text-gray-400">{new Date(update.created_on).toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            {update.comment && (
                              <p className="text-sm text-gray-300 leading-relaxed mb-2">{update.comment}</p>
                            )}
                            {update.info_url && (
                              <a 
                                href={update.info_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm inline-block"
                              >
                                More Information →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">
                      <p>No updates available for this launch.</p>
                      <p className="text-sm text-gray-500 mt-2">Check back later for launch status updates.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'TIMELINE' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold mb-3">Launch Timeline</h4>
                  {launch.timeline && Array.isArray(launch.timeline) && launch.timeline.length > 0 ? (
                    launch.timeline.map((event, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {event.type ? (
                              <>
                                {event.type.abbrev && (
                                  <h4 className="text-lg font-bold">{event.type.abbrev}</h4>
                                )}
                                {event.type.description && (
                                  <p className="text-sm text-gray-400 mt-1">{event.type.description}</p>
                                )}
                                {event.type.id && (
                                  <span className="text-xs text-gray-500">Type ID: {event.type.id}</span>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-400">Timeline Event</p>
                            )}
                          </div>
                          {event.relative_time && (
                            <span className="text-xs text-gray-400 font-mono">{event.relative_time}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">
                      <p>No timeline data available for this launch.</p>
                      <p className="text-sm text-gray-500 mt-2">Timeline data may not be available from the source API for this launch.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'MEDIA' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold mb-3">Media</h4>
                  {image && image.image_url && (
                    <div>
                      <h5 className="text-md font-bold mb-3">Launch Image</h5>
                      <img 
                        src={image.image_url} 
                        alt={launch.name}
                        className="w-full h-auto rounded"
                      />
                      {image.credit && (
                        <p className="text-xs text-gray-400 mt-2">Credit: {image.credit}</p>
                      )}
                    </div>
                  )}
                  {mission && mission.image && mission.image.image_url && (
                    <div>
                      <h5 className="text-md font-bold mb-3">Mission Image</h5>
                      <img 
                        src={mission.image.image_url} 
                        alt={mission.name || 'Mission Image'}
                        className="w-full h-auto rounded"
                      />
                      {mission.image.credit && (
                        <p className="text-xs text-gray-400 mt-2">Credit: {mission.image.credit}</p>
                      )}
                    </div>
                  )}
                  {pad && pad.image && pad.image.image_url && (
                    <div>
                      <h5 className="text-md font-bold mb-3">Launch Pad Image</h5>
                      <img 
                        src={pad.image.image_url} 
                        alt={pad.name || 'Launch Pad Image'}
                        className="w-full h-auto rounded"
                      />
                      {pad.image.credit && (
                        <p className="text-xs text-gray-400 mt-2">Credit: {pad.image.credit}</p>
                      )}
                    </div>
                  )}
                  {infographic && infographic.image_url && (
                    <div>
                      <h5 className="text-md font-bold mb-3">Infographic</h5>
                      <img 
                        src={infographic.image_url} 
                        alt={`${launch.name} Infographic`}
                        className="w-full h-auto rounded"
                      />
                      {infographic.credit && (
                        <p className="text-xs text-gray-400 mt-2">Credit: {infographic.credit}</p>
                      )}
                    </div>
                  )}
                  {launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-3">Videos</h4>
                      <div className="space-y-4">
                        {launch.vid_urls.map((urlObj, idx) => {
                          const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                          const title = typeof urlObj === 'object' ? urlObj.title : null;
                          const description = typeof urlObj === 'object' ? urlObj.description : null;
                          const publisher = typeof urlObj === 'object' ? urlObj.publisher : null;
                          const featureImage = typeof urlObj === 'object' ? urlObj.feature_image : null;
                          const live = typeof urlObj === 'object' ? urlObj.live : false;
                          
                          return (
                            <div key={idx} className="border-b border-gray-800 pb-3 last:border-0">
                              {featureImage && (
                                <img 
                                  src={featureImage} 
                                  alt={title || 'Video thumbnail'}
                                  className="w-full h-auto rounded mb-2"
                                />
                              )}
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-[#8B1A1A] hover:text-[#A02A2A] underline font-semibold mb-1"
                              >
                                {title || url}
                              </a>
                              {description && (
                                <p className="text-sm text-gray-300 mb-1">{description}</p>
                              )}
                              {publisher && (
                                <p className="text-xs text-gray-400">Publisher: {publisher}</p>
                              )}
                              {live && (
                                <span className="inline-block mt-2 px-2 py-1 bg-red-600 text-white text-xs font-bold">LIVE</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-3">Information Links</h4>
                      <div className="space-y-4">
                        {launch.info_urls.map((urlObj, idx) => {
                          const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                          const title = typeof urlObj === 'object' ? urlObj.title : null;
                          const description = typeof urlObj === 'object' ? urlObj.description : null;
                          const source = typeof urlObj === 'object' ? urlObj.source : null;
                          
                          return (
                            <div key={idx} className="border-b border-gray-800 pb-3 last:border-0">
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-[#8B1A1A] hover:text-[#A02A2A] underline font-semibold mb-1"
                              >
                                {title || url}
                              </a>
                              {description && (
                                <p className="text-sm text-gray-300 mb-1">{description}</p>
                              )}
                              {source && (
                                <p className="text-xs text-gray-400">Source: {source}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {activeTab === 'PROGRAM' && (
                <div className="space-y-4">
                  {program && program.length > 0 ? (
                    program.map((prog, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-2">{prog.name || 'Program'}</h4>
                        {prog.description && (
                          <p className="text-sm text-gray-300 leading-relaxed">{prog.description}</p>
                        )}
                        {prog.agencies && Array.isArray(prog.agencies) && prog.agencies.length > 0 && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">Agencies: </span>
                            <span className="text-white text-sm">{prog.agencies.map(a => a.name || a.abbrev).filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        {prog.image_url && (
                          <img 
                            src={prog.image_url} 
                            alt={prog.name}
                            className="w-full h-auto rounded mt-2"
                          />
                        )}
                        {prog.info_url && (
                          <a 
                            href={prog.info_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block"
                          >
                            More Information →
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">
                      <p>No program information available for this launch.</p>
                      <p className="text-sm text-gray-500 mt-2">This launch may not be part of a formal space program.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'PATCHES' && (
                <div className="space-y-4">
                  {launch.mission_patches && launch.mission_patches.length > 0 ? (
                    launch.mission_patches.map((patch, idx) => (
                      <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                        {patch.name && (
                          <h4 className="text-lg font-bold mb-2">{patch.name}</h4>
                        )}
                        {patch.image_url && (
                          <img 
                            src={patch.image_url} 
                            alt={patch.name || 'Mission Patch'}
                            className="w-48 h-48 object-contain rounded mb-2"
                          />
                        )}
                        {patch.agency && (
                          <div className="text-sm text-gray-300">
                            <span className="text-gray-400">Agency: </span>
                            <span className="font-semibold">{patch.agency.name || patch.agency.abbrev}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">
                      <p>No mission patches available for this launch.</p>
                      <p className="text-sm text-gray-500 mt-2">Mission patches may not be available for all launches.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Launch Overview */}
            <div className="bg-gray-900 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">LIFT OFF TIME</h3>
              <div className="text-sm mb-4 text-white">
                {formatDate(launch.net)}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(launch.net)}
              </div>
            </div>

            {/* Launch Window */}
            {(launch.window_start || launch.window_end || launch.launch_window_open || launch.launch_window_close || (launch.windows && launch.windows.length > 0)) && (
            <div className="bg-gray-900 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">LAUNCH WINDOW</h3>
                <div className="text-sm space-y-2">
                <div>
                    <span className="text-gray-400">Start:</span>{' '}
                    <span className="text-white">
                      {launch.window_start 
                        ? formatTime(launch.window_start)
                        : launch.launch_window_open
                        ? formatTime(launch.launch_window_open)
                  : launch.windows && launch.windows.length > 0
                        ? formatTime(launch.windows[0].window_open)
                  : 'TBD'}
                  </span>
              </div>
                <div>
                    <span className="text-gray-400">End:</span>{' '}
                    <span className="text-white">
                      {launch.window_end
                        ? formatTime(launch.window_end)
                        : launch.launch_window_close
                        ? formatTime(launch.launch_window_close)
                  : launch.windows && launch.windows.length > 0 && launch.windows[0].window_close
                        ? formatTime(launch.windows[0].window_close)
                  : 'TBD'}
                  </span>
              </div>
            </div>
              </div>
            )}

            {/* Launch Facility */}
            <div className="bg-gray-900 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">LAUNCH FACILITY</h3>
              <div className="space-y-3 text-sm">
                {pad.location?.name && (
                <div>
                    <span className="text-gray-400">Site:</span>{' '}
                    <span className="font-semibold text-white">{pad.location.name}</span>
                </div>
                )}
                {pad.name && (
                <div>
                    <span className="text-gray-400">Pad:</span>{' '}
                    <span className="font-semibold text-white">{pad.name}</span>
                </div>
                )}
                {pad.country_code && (
                <div>
                    <span className="text-gray-400">Country:</span>{' '}
                    <span className="font-semibold text-white">{pad.country_code}</span>
                </div>
                )}
              </div>
            </div>

            {/* Mission Overview */}
            <div className="bg-gray-900 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">MISSION OVERVIEW</h3>
              <div className="space-y-3 text-sm">
                {mission.type && (
                <div>
                    <span className="text-gray-400">Type:</span>{' '}
                    <span className="font-semibold text-white">{mission.type}</span>
                </div>
                )}
                {mission.orbit?.name && (
                  <div>
                    <span className="text-gray-400">Orbit:</span>{' '}
                    <span className="font-semibold text-white">{mission.orbit.name}</span>
                  </div>
                )}
                {mission.orbit?.abbrev && (
                  <div>
                    <span className="text-gray-400">Orbit Code:</span>{' '}
                    <span className="font-semibold text-white">{mission.orbit.abbrev}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payload Summary */}
            {launch.payloads && launch.payloads.length > 0 && (
            <div className="bg-gray-900 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">PAYLOAD SUMMARY</h3>
              <div className="space-y-3 text-sm">
                <div>
                    <span className="text-gray-400">Count:</span>{' '}
                    <span className="font-semibold text-white">{launch.payloads.length}</span>
                </div>
                <div>
                    <span className="text-gray-400">Total Mass:</span>{' '}
                    <span className="font-semibold text-white">
                      {launch.payloads.reduce((sum, p) => sum + (parseFloat(p.mass_kg) || 0), 0)} kg
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">Payloads:</span>
                    <div className="mt-1 space-y-1">
                      {launch.payloads.map((p, idx) => (
                        <div key={idx} className="text-white text-xs">
                          • {p.name || 'Unnamed Payload'}
              </div>
                      ))}
            </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recovery Summary */}
            {launch.recovery && (
              <div className="bg-gray-900 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">RECOVERY</h3>
                <div className="space-y-2 text-sm">
                  {launch.recovery.landed !== null && launch.recovery.landed !== undefined && (
                <div>
                      <span className={`font-semibold ${launch.recovery.landed ? 'text-green-500' : 'text-red-500'}`}>
                        {launch.recovery.landed ? '✓ Landed Successfully' : '✗ Landing Failed'}
                      </span>
                    </div>
                  )}
                  {launch.recovery.landing_location && (
                    <div className="text-gray-300">{launch.recovery.landing_location}</div>
                  )}
                  {launch.recovery.landing_type && (
                    <div className="text-gray-300">{launch.recovery.landing_type}</div>
                  )}
                </div>
              </div>
            )}


            {/* Related Stories */}
            {relatedStories.length > 0 && (
              <div className="bg-gray-900 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">RELATED STORIES</h3>
                <div className="space-y-4">
                  {relatedStories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/news/${story.slug || story.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="h-24 bg-gray-800 mb-2 rounded"></div>
                      <div className="text-sm font-semibold line-clamp-2 text-white">{story.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LaunchDetail;
