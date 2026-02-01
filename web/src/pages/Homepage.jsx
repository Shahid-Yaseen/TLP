import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import LaunchCard from '../components/LaunchCard';
import ArticleCard from '../components/ArticleCard';
import RecoveryBadge from '../components/RecoveryBadge';
import API_URL from '../config/api';
import RedDotLoader from '../components/common/RedDotLoader';

const Homepage = () => {
  const [launches, setLaunches] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [rockets, setRockets] = useState([]);
  const [totalRockets, setTotalRockets] = useState(0);
  const [heroImage, setHeroImage] = useState('https://thespacedevs-prod.nyc3.digitaloceanspaces.com/media/images/spectrum_on_the_image_20250321072643.jpeg');
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Preload hero image to ensure it's ready
  useEffect(() => {
    if (heroImage) {
      const img = new Image();
      img.onload = () => setHeroImageLoaded(true);
      img.onerror = () => {
        console.warn('Failed to load hero image:', heroImage);
        setHeroImageLoaded(false);
      };
      img.src = heroImage;
    }
  }, [heroImage]);

  useEffect(() => {
    fetchData();
  }, []);

  // Format date as "Sept 2 @ 11:45" style, displayed on 2 rows
  const formatLaunchDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      return (
        <>
          {month} {day}
          <br />
          @ {displayHours}:{minutes}{ampm}
        </>
      );
    } catch (error) {
      return 'TBD';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Create axios instance with longer timeout
      const apiClient = axios.create({
        baseURL: API_URL,
        timeout: 30000,
      });

      // Fetch data with error handling for each endpoint
      const [launchesRes, featuredLaunchRes, eventsRes, statsRes, articlesRes, rocketsRes, totalRocketsRes] = await Promise.allSettled([
        // Use the dedicated upcoming endpoint so results are ordered soonest-first
        apiClient.get('/api/launches/upcoming?limit=3'),
        // Fetch a featured launch for hero image
        apiClient.get('/api/launches/featured?limit=1'),
        apiClient.get('/api/events/upcoming?limit=3&offset=0'),
        apiClient.get('/api/statistics/launches'),
        apiClient.get('/api/news?limit=6&offset=0&status=published'),
        apiClient.get('/api/spacebase/rockets?limit=5'),
        apiClient.get('/api/spacebase/rockets'), // Get all for count
      ]);

      // Handle launches response
      if (launchesRes.status === 'fulfilled') {
        const launchesData = launchesRes.value.data?.data || launchesRes.value.data || [];
        setLaunches(Array.isArray(launchesData) ? launchesData : []);
      } else {
        console.warn('Failed to fetch launches:', launchesRes.reason?.message || launchesRes.reason);
        setLaunches([]);
      }

      // Helper function to extract image URL from launch object
      const getLaunchImageUrl = (launch) => {
        if (!launch) return null;
        // Try image_json.image_url first (most common)
        if (launch.image_json?.image_url) {
          return launch.image_json.image_url;
        }
        // Fallback to mission_image_url
        if (launch.mission_image_url) {
          return launch.mission_image_url;
        }
        // Fallback to infographic_url
        if (launch.infographic_url) {
          return launch.infographic_url;
        }
        return null;
      };

      // Hero image is set to use the fixed default image specified
      // Disabled automatic image fetching to always use the specified hero image
      // The heroImage state is initialized with the desired image URL

      // Handle events response (real DB-backed upcoming events)
      if (eventsRes.status === 'fulfilled') {
        const eventsData = eventsRes.value.data?.data || eventsRes.value.data || [];
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        console.warn('Failed to fetch events:', eventsRes.reason?.message || eventsRes.reason);
        setEvents([]);
      }

      // Statistics are returned directly
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null);
      } else {
        console.warn('Failed to fetch statistics:', statsRes.reason?.message);
        setStats(null);
      }

      // Handle articles response
      if (articlesRes.status === 'fulfilled') {
        const articlesData = articlesRes.value.data?.data || articlesRes.value.data || [];
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      } else {
        console.warn('Failed to fetch articles:', articlesRes.reason?.message);
        setArticles([]);
      }

      // Handle rockets response
      let displayedRockets = [];
      if (rocketsRes.status === 'fulfilled') {
        const rocketsData = rocketsRes.value.data?.data || rocketsRes.value.data || [];
        displayedRockets = Array.isArray(rocketsData) ? rocketsData : [];
        setRockets(displayedRockets);
      } else {
        console.warn('Failed to fetch rockets:', rocketsRes.reason?.message);
        setRockets([]);
      }

      // Handle total rockets count
      if (totalRocketsRes.status === 'fulfilled') {
        const totalRocketsData = totalRocketsRes.value.data?.data || totalRocketsRes.value.data || [];
        setTotalRockets(Array.isArray(totalRocketsData) ? totalRocketsData.length : displayedRockets.length || 623);
      } else {
        // Fallback to displayed rockets count or default
        setTotalRockets(displayedRockets.length || 623);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      setLoading(false);
    }
  };

  const panelClassName =
    'relative overflow-hidden bg-[#1b1b1b] shadow-[0_0_35px_rgba(0,0,0,0.65)] ring-1 ring-white/5';

  const PanelTopAccent = () => (
    <div className="absolute left-0 top-0 h-1 w-full bg-[#8B1A1A]" aria-hidden="true" />
  );

  const PanelTopAccentOrange = () => (
    <div className="absolute left-0 top-0 h-1 w-full bg-[#fa9a00]" aria-hidden="true" />
  );

  const PanelTopAccentBlue = () => (
    <div className="absolute left-0 top-0 h-1 w-full bg-[#1f4fbf]" aria-hidden="true" />
  );

  const cleanMissionName = (name, rocketName) => {
    if (!name || !rocketName) return name;
    const withSpaces = `${rocketName} | `;
    const noSpaces = `${rocketName}|`;
    if (name.startsWith(withSpaces)) return name.slice(withSpaces.length);
    if (name.startsWith(noSpaces)) return name.slice(noSpaces.length).trimStart();
    return name;
  };

  const TwoLine = ({ children, className = '' }) => (
    <div
      className={`min-w-0 whitespace-normal leading-snug ${className}`}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {children}
    </div>
  );

  const formatDaysAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  const NewsCard = ({ article }) => {
    const img = article?.featured_image_url;
    const title = article?.title || 'Untitled';
    const age = formatDaysAgo(article?.published_at || article?.created_at);
    const tag = article?.category?.name || 'NEWS';

    return (
      <Link
        to={`/news/${article.slug || article.id}`}
        className="group bg-[#1b1b1b] shadow-[0_0_18px_rgba(0,0,0,0.55)] ring-1 ring-white/10 hover:ring-white/20 transition-colors overflow-hidden"
      >
        <div className="aspect-video w-full bg-black">
          {img ? (
            <img
              src={img}
              alt={title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : null}
        </div>

        <div className="p-4">
          <div className="text-white font-semibold uppercase leading-snug mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            <TwoLine className="text-base">{title}</TwoLine>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/20">
                <span className="block w-[6px] h-[6px] rounded-full bg-white/70" />
              </span>
              <span>{age}</span>
            </div>

            <span className="text-white/30">|</span>

            <div className="flex items-center gap-2">
              {[tag, 'SPACE', 'TLP'].slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-[#fa9a00] text-black font-bold uppercase tracking-wide"
                  style={{ fontSize: '10px' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const DigitGroup = ({ value, size = 'lg' }) => {
    // Convert to string and split into individual digits, showing all digits
    const digits = String(value ?? 0).split('');

    const boxClassName =
      size === 'lg'
        ? 'h-16 w-14 text-4xl'
        : 'h-14 w-12 text-3xl';

    return (
      <div className="flex items-center justify-center gap-2 mx-auto">
        {digits.map((digit, idx) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${digit}-${idx}`}
            className={[
              'flex items-center justify-center',
              boxClassName,
              'bg-[#232323]',
              'border border-white/20',
              'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
              'font-mono font-bold leading-none text-white',
            ].join(' ')}
          >
            {digit}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src={heroImage}
          alt="Launch background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
          onError={(e) => {
            console.error('Failed to load hero image:', heroImage);
            e.target.style.display = 'none';
          }}
        />
        {/* Dark Overlay - balanced opacity for text readability and image visibility */}
        <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}></div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white uppercase tracking-tight" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            THE LAUNCH PAD
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-2 text-gray-200 font-light">
            TO INFORM AND INSPIRE THE EXPLORERS OF TOMORROW
          </p>
          <p className="text-base md:text-lg lg:text-xl text-gray-300 font-light">
            BECAUSE SPACE IS BETTER TOGETHER
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-12 space-y-12">
        {/* Three-Column Section: Upcoming Departures, Events, Statistics */}
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,max-content)] gap-4">
          {/* Wide Panel - Upcoming Earth Departures + Events */}
          <div className={`${panelClassName} md:col-span-2 p-6 pt-10`}>
            <PanelTopAccent />
            <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] gap-10 min-w-0">
              {/* Left Half - Upcoming Earth Departures */}
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide text-white/90 mb-6">
                  UPCOMING EARTH DEPARTURES
                </h2>

                <div className="mb-6">
                  {loading ? (
                    <div className="py-6">
                      <RedDotLoader size="small" />
                    </div>
                  ) : launches.length > 0 ? (
                    <div>
                      {launches.slice(0, 3).map((launch, index) => {
                        const rocketName = launch.rocket || launch.rocket_id || 'TBD';
                        const siteName = launch.site || launch.launch_site?.name || 'Location TBD';
                        const missionName = cleanMissionName(launch.name, rocketName);
                        return (
                          <div key={launch.id} className="py-3">
                            <div className="hidden md:grid md:grid-cols-[105px_minmax(0,360px)_minmax(0,220px)_minmax(180px,1fr)] md:gap-2 md:items-start">
                              <TwoLine className="text-white/90 text-lg font-semibold">
                                {formatLaunchDateTime(launch.launch_date)}
                              </TwoLine>
                              <TwoLine className="text-white/90 text-lg font-semibold">
                                {missionName}
                              </TwoLine>
                              <TwoLine className="text-white/90 text-lg font-semibold">
                                {rocketName}
                              </TwoLine>
                              <TwoLine className="text-white/90 text-lg font-semibold">
                                {siteName}
                              </TwoLine>
                            </div>

                            <div className="md:hidden space-y-1 text-white/90">
                              <div className="text-base font-semibold">
                                {formatLaunchDateTime(launch.launch_date)}
                              </div>
                              <div className="text-base font-semibold">{missionName}</div>
                              <div className="text-sm">{rocketName}</div>
                              <div className="text-sm">{siteName}</div>
                            </div>

                            {index < Math.min(launches.length, 3) - 1 ? (
                              <div className="mt-3 border-b-2 border-white/25" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm py-6">No upcoming launches</div>
                  )}
                </div>

                <Link
                  to="/launches/upcoming"
                  className="inline-block bg-[#8B1A1A] hover:bg-[#a01f1f] text-white font-semibold px-5 py-2 transition-colors uppercase text-sm"
                >
                  Enter Launch Center
                </Link>
              </div>

              {/* Right Half - Upcoming Events */}
              <div className="min-w-0 w-full md:max-w-[380px] md:justify-self-end">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide text-white/90 mb-6">
                  UPCOMING EVENTS
                </h2>

                {loading ? (
                  <div className="py-6">
                    <RedDotLoader size="small" />
                  </div>
                ) : events.length > 0 ? (
                  <div>
                    {events.slice(0, 3).map((event, index) => (
                      <div key={event.id} className="py-4">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6">
                          <TwoLine className="text-white/90 text-lg font-semibold">{event.name}</TwoLine>
                          <div className="text-white/80 text-lg font-semibold whitespace-nowrap">{event.status}</div>
                        </div>

                        {index < Math.min(events.length, 3) - 1 ? (
                          <div className="mt-4 border-b-2 border-white/25" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm py-6">No upcoming events</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Launch Statistics */}
          <div className={`${panelClassName} p-6 pt-10 w-full md:w-fit md:max-w-md md:justify-self-end text-center`}>
            <PanelTopAccent />
            <div className="mb-6 flex flex-col items-center">
              <div className="flex justify-center mb-3">
                <DigitGroup value={stats?.total_launches || stats?.total || 0} size="lg" />
              </div>
              <div className="text-gray-300 text-xs uppercase tracking-widest mb-8">
                TOTAL LAUNCHES
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 w-fit mx-auto justify-items-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex justify-center items-center mb-3">
                    <DigitGroup value={stats?.total_successes || stats?.successes || 0} size="sm" />
                  </div>
                  <div className="text-gray-300 text-xs uppercase tracking-widest text-center">
                    TOTAL SUCCESSES
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex justify-center items-center mb-3">
                    <DigitGroup value={stats?.total_failures || stats?.failures || 0} size="sm" />
                  </div>
                  <div className="text-gray-300 text-xs uppercase tracking-widest text-center">
                    TOTAL FAILURES
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                to="/launches/statistics"
                className="inline-block bg-[#8B1A1A] hover:bg-[#a01f1f] text-white font-semibold px-5 py-2 transition-colors uppercase text-sm"
              >
                Full Launch Statistics
              </Link>
            </div>
          </div>
        </div>

        {/* Latest Space News + 24/7 Streams (side-by-side like design) */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-4">
          {/* Latest Space News */}
          <div className={`${panelClassName} p-6 pt-10`}>
            <PanelTopAccentOrange />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                LATEST SPACE NEWS
              </h2>
              <Link
                to="/news"
                className="bg-[#fa9a00] hover:bg-[#ffad2a] text-black font-bold px-4 py-2 uppercase text-sm"
                style={{ fontFamily: 'Nasalization, sans-serif' }}
              >
                Go To The NewsRoom
              </Link>
            </div>

            {loading ? (
              <div className="py-10">
                <RedDotLoader size="medium" />
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {articles.slice(0, 6).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-10">No articles available</div>
            )}
          </div>

          {/* 24/7 Streams */}
          <div className={`${panelClassName} p-6 pt-10`}>
            <PanelTopAccentOrange />
            <h2 className="text-2xl font-bold uppercase tracking-wide text-white mb-6" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              24/7 STREAMS
            </h2>

            <div className="space-y-6">
              {/* Starbase Now */}
              <div className="bg-[#232323] ring-1 ring-white/10 shadow-[0_0_18px_rgba(0,0,0,0.55)] p-6 min-h-[120px] flex flex-col justify-between">
                <div className="text-white text-2xl font-semibold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  Starbase Now
                </div>
                <div className="inline-flex items-center gap-2 bg-black/70 ring-1 ring-white/10 px-3 py-2 w-fit">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                  <span className="text-red-500 font-bold uppercase text-sm">LIVE</span>
                </div>
              </div>

              {/* ISS Now */}
              <div className="bg-[#232323] ring-1 ring-white/10 shadow-[0_0_18px_rgba(0,0,0,0.55)] p-6 min-h-[120px] flex flex-col justify-between">
                <div className="text-white text-2xl font-semibold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  ISS Now
                </div>
                <div className="inline-flex items-center gap-2 bg-black/70 ring-1 ring-white/10 px-3 py-2 w-fit">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                  <span className="text-red-500 font-bold uppercase text-sm">LIVE</span>
                </div>
              </div>

              {/* Space Coast East */}
              <div className="bg-[#232323] ring-1 ring-white/10 shadow-[0_0_18px_rgba(0,0,0,0.55)] p-6 min-h-[120px] flex flex-col justify-between">
                <div className="text-white text-2xl font-semibold" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                  Space Coast East
                </div>
                <div className="inline-flex items-center gap-2 bg-black/70 ring-1 ring-white/10 px-3 py-2 w-fit">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-gray-300 font-semibold text-sm">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacebase Section */}
        <div className={`${panelClassName} p-6 pt-10`}>
          <PanelTopAccentBlue />
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-baseline gap-6">
              <h2
                className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white"
                style={{ fontFamily: 'Nasalization, sans-serif' }}
              >
                SPACEBASE
              </h2>
              <p className="text-gray-300 text-sm md:text-base">
                A Complete Space History Database
              </p>
            </div>
            <Link
              to="/spacebase"
              className="bg-[#1f4fbf] hover:bg-[#2b64e0] text-white font-semibold px-6 py-2 transition-colors uppercase text-sm whitespace-nowrap shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
              style={{ fontFamily: 'Nasalization, sans-serif' }}
            >
              Enter The Database
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Link
                key={i}
                to="/spacebase/rockets"
                className="group bg-[#232323] shadow-[0_0_18px_rgba(0,0,0,0.55)] ring-1 ring-white/10 hover:ring-white/20 transition-colors"
              >
                <div className="p-3">
                  <div className="aspect-video w-full overflow-hidden bg-black ring-1 ring-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                    <img
                      src="/electron_image_20190705175640.jpeg"
                      alt="Launch vehicle"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="px-4 pb-4 text-center">
                  <div
                    className="text-white text-lg font-bold uppercase"
                    style={{ fontFamily: 'Nasalization, sans-serif' }}
                  >
                    LAUNCH VEHICLES
                  </div>
                  <div className="text-gray-300 text-sm">
                    {Math.max(totalRockets || 0, 623)} Profiles
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Homepage;
