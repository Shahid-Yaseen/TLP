import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import LaunchCard from '../components/LaunchCard';
import ArticleCard from '../components/ArticleCard';
import API_URL from '../config/api';
import RedDotLoader from '../components/common/RedDotLoader';

const Homepage = () => {
  const [launches, setLaunches] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Create axios instance with longer timeout
      const apiClient = axios.create({
        baseURL: API_URL,
        timeout: 30000, // 30 seconds instead of 10
      });

      // Fetch data with error handling for each endpoint
      const [launchesRes, statsRes, articlesRes, featuredRes] = await Promise.allSettled([
        apiClient.get('/api/launches?limit=3&offset=0'),
        apiClient.get('/api/statistics/launches'),
        apiClient.get('/api/news?limit=6&offset=0&status=published'),
        apiClient.get('/api/featured'),
      ]);

      // Handle launches response (may be wrapped in data property)
      if (launchesRes.status === 'fulfilled') {
        const launchesData = launchesRes.value.data?.data || launchesRes.value.data || [];
        setLaunches(Array.isArray(launchesData) ? launchesData : []);
      } else {
        console.warn('Failed to fetch launches:', launchesRes.reason?.message || launchesRes.reason);
        setLaunches([]);
      }

      // Events endpoint doesn't exist, set empty array
      setEvents([]);

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

      // Featured content
      if (featuredRes.status === 'fulfilled') {
        const featuredData = featuredRes.value.data?.data || featuredRes.value.data || null;
        setFeatured(featuredData);
      } else {
        console.warn('Failed to fetch featured:', featuredRes.reason?.message);
        setFeatured(null);
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
        className="relative h-[60vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">THE LAUNCH PAD</h1>
          <p className="text-xl md:text-2xl mb-2">TO INFORM AND INSPIRE THE EXPLORERS OF TOMORROW</p>
          <p className="text-lg md:text-xl">BECAUSE SPACE IS BETTER TOGETHER</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Upcoming Departures & Events */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Earth Departures */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4">UPCOMING EARTH DEPARTURES</h2>
            <div className="space-y-3 mb-4">
              {loading ? (
                <div className="py-4">
                  <RedDotLoader size="small" />
                </div>
              ) : launches.length > 0 ? (
                launches.map((launch) => (
                  <div key={launch.id} className="border-l-4 border-gray-600 pl-4">
                    <div className="text-sm text-gray-400">
                      {new Date(launch.launch_date).toLocaleDateString()} @{' '}
                      {new Date(launch.launch_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-semibold">{launch.name}</div>
                    <div className="text-sm text-gray-400">{launch.rocket || launch.rocket_id || 'TBD'}</div>
                    <div className="text-xs text-gray-500">{launch.site || launch.launch_site?.name || 'Location TBD'}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No upcoming launches</div>
              )}
            </div>
            <Link
              to="/launches"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors"
            >
              Enter Launch Center
            </Link>
          </div>

          {/* Upcoming Events */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold mb-4">UPCOMING EVENTS</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="py-4">
                  <RedDotLoader size="small" />
                </div>
              ) : events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="border-l-4 border-gray-600 pl-4">
                    <div className="font-semibold">{event.name}</div>
                    <div className="text-sm text-gray-400">Status: {event.status || 'TBD'}</div>
                    <div className="text-xs text-gray-500">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : 'Date TBD'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No upcoming events</div>
              )}
            </div>
          </div>
        </div>

        {/* Launch Statistics - Hidden for now */}
        {/* <div className="bg-gray-900 p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-4">
            <div>
              <div className="text-4xl font-bold mb-2">{stats?.total_launches || 0}</div>
              <div className="text-gray-400">TOTAL LAUNCHES</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-green-500">{stats?.total_successes || 0}</div>
              <div className="text-gray-400">TOTAL SUCCESSES</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-red-500">{stats?.total_failures || 0}</div>
              <div className="text-gray-400">TOTAL FAILURES</div>
            </div>
          </div>
          <Link
            to="/launches"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors"
          >
            Full Launch Statistics
          </Link>
        </div> */}

        {/* Latest Space News */}
        <div className="bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">LATEST SPACE NEWS</h2>
            <Link
              to="/news"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors"
            >
              Go To The NewsRoom
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 py-8">
                <RedDotLoader size="medium" />
              </div>
            ) : articles.length > 0 ? (
              articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-3 text-gray-400">No articles available</div>
            )}
          </div>
        </div>

        {/* 24/7 Streams */}
        <div className="bg-gray-900 p-6">
          <h2 className="text-2xl font-bold mb-4">24/7 STREAMS</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold">• LIVE</span>
              <span className="font-semibold">Starbase Now</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold">• LIVE</span>
              <span className="font-semibold">ISS Now</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">• Coming Soon</span>
              <span className="font-semibold">Space Coast East</span>
            </div>
          </div>
        </div>

        {/* Spacebase */}
        <div className="bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">SPACEBASE</h2>
              <p className="text-gray-400">A Complete Space History Database</p>
            </div>
            <Link
              to="/spacebase"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 transition-colors"
            >
              Enter The Database
            </Link>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-800 p-4">
                <div className="h-32 bg-gray-700 mb-2"></div>
                <div className="font-semibold">LAUNCH VEHICLES</div>
                <div className="text-sm text-gray-400">623 Profiles</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Homepage;
