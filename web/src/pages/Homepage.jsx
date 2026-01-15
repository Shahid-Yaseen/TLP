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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Format date as "Sept 2 @ 11:45" style
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
      return `${month} ${day} @ ${displayHours}:${minutes}${ampm}`;
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
      const [launchesRes, statsRes, articlesRes, rocketsRes, totalRocketsRes] = await Promise.allSettled([
        apiClient.get('/api/launches?limit=3&offset=0&after=' + new Date().toISOString()),
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

      // Events endpoint doesn't exist, set placeholder data
      setEvents([
        { id: 1, name: 'Crew 12 Launch', status: 'TBD' },
        { id: 2, name: 'Artemis III Return', status: 'Return' },
        { id: 3, name: 'Mars Sample Return', status: 'Never' },
      ]);

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

  const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

  return (
    <Layout>
      {/* Hero Section */}
      <div
        className="relative h-[70vh] min-h-[500px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white uppercase tracking-tight">
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-12">
        {/* Three-Column Section: Upcoming Departures, Events, Statistics */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Upcoming Earth Departures */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4 uppercase">Upcoming Earth Departures</h2>
            <div className="space-y-4 mb-6">
              {loading ? (
                <div className="py-4">
                  <RedDotLoader size="small" />
                </div>
              ) : launches.length > 0 ? (
                launches.map((launch) => (
                  <div key={launch.id} className="border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                    <div className="text-sm text-gray-400 mb-1">
                      {formatLaunchDateTime(launch.launch_date)}
                    </div>
                    <div className="font-semibold text-white mb-1">{launch.name}</div>
                    <div className="text-sm text-gray-400 mb-1">
                      {launch.rocket || launch.rocket_id || 'TBD'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {launch.site || launch.launch_site?.name || 'Location TBD'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">No upcoming launches</div>
              )}
            </div>
            <Link
              to="/launches/upcoming"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors uppercase text-sm"
            >
              Enter Launch Center
            </Link>
          </div>

          {/* Middle Column - Upcoming Events */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4 uppercase">Upcoming Events</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="py-4">
                  <RedDotLoader size="small" />
                </div>
              ) : events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-white flex-1">{event.name}</div>
                      <span className={`text-xs px-2 py-1 ml-2 ${
                        event.status === 'TBD' ? 'bg-gray-700 text-gray-300' :
                        event.status === 'Return' ? 'bg-blue-900 text-blue-300' :
                        event.status === 'Never' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">No upcoming events</div>
              )}
            </div>
          </div>

          {/* Right Column - Launch Statistics */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4 uppercase">Launch Statistics</h2>
            <div className="space-y-6 mb-6">
              <div>
                <div className="text-5xl font-bold mb-2 text-white">
                  {stats?.total_launches || stats?.total || 0}
                </div>
                <div className="text-gray-400 text-sm uppercase">Total Launches</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2 text-green-500">
                  {stats?.total_successes || stats?.successes || 0}
                </div>
                <div className="text-gray-400 text-sm uppercase">Total Successes</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2 text-red-500">
                  {stats?.total_failures || stats?.failures || 0}
                </div>
                <div className="text-gray-400 text-sm uppercase">Total Failures</div>
              </div>
            </div>
            <Link
              to="/launches/statistics"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors uppercase text-sm"
            >
              Full Launch Statistics
            </Link>
          </div>
        </div>

        {/* Latest Space News Section */}
        <div className="bg-gray-900 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold uppercase">Latest Space News</h2>
            <Link
              to="/news"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors uppercase text-sm whitespace-nowrap"
            >
              Go To The NewsRoom
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 py-8">
                <RedDotLoader size="medium" />
              </div>
            ) : articles.length > 0 ? (
              articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-3 text-gray-400 text-center py-8">No articles available</div>
            )}
          </div>
        </div>

        {/* 24/7 Streams Section */}
        <div className="bg-gray-900 p-6">
          <h2 className="text-2xl font-bold mb-6 uppercase">24/7 Streams</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors cursor-pointer">
              <span className="text-red-500 font-bold text-lg">•</span>
              <span className="text-red-500 font-bold uppercase">Live</span>
              <span className="font-semibold text-white ml-2">Starbase Now</span>
            </div>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors cursor-pointer">
              <span className="text-red-500 font-bold text-lg">•</span>
              <span className="text-red-500 font-bold uppercase">Live</span>
              <span className="font-semibold text-white ml-2">ISS Now</span>
            </div>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors cursor-pointer">
              <span className="text-gray-500 font-bold text-lg">•</span>
              <span className="text-gray-500 font-semibold">Coming Soon</span>
              <span className="font-semibold text-white ml-2">Space Coast East</span>
            </div>
          </div>
        </div>

        {/* Spacebase Section */}
        <div className="bg-gray-900 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 uppercase">Spacebase</h2>
              <p className="text-gray-400">A Complete Space History Database</p>
            </div>
            <Link
              to="/spacebase"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors uppercase text-sm whitespace-nowrap"
            >
              Enter The Database
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-5 py-8">
                <RedDotLoader size="medium" />
              </div>
            ) : rockets.length > 0 ? (
              rockets.map((rocket) => (
                <Link
                  key={rocket.id}
                  to={`/spacebase/rockets/${rocket.id}`}
                  className="bg-gray-800 hover:bg-gray-700 transition-colors p-4 group"
                >
                  <div className="h-32 bg-gray-700 mb-3 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                    {rocket.image_url ? (
                      <img
                        src={rocket.image_url}
                        alt={rocket.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="hidden h-full w-full items-center justify-center text-gray-500 text-4xl">
                      🚀
                    </div>
                  </div>
                  <div className="font-semibold text-white text-sm uppercase mb-1">Launch Vehicles</div>
                  <div className="text-xs text-gray-400">
                    {totalRockets || rockets.length || 623} Profiles
                  </div>
                </Link>
              ))
            ) : (
              // Fallback to placeholder cards if no rockets
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-800 p-4">
                  <div className="h-32 bg-gray-700 mb-3 flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">🚀</span>
                  </div>
                  <div className="font-semibold text-white text-sm uppercase mb-1">Launch Vehicles</div>
                  <div className="text-xs text-gray-400">{totalRockets || 623} Profiles</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Homepage;
