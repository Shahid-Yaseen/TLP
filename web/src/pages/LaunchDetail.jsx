import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const LaunchDetail = () => {
  const { id } = useParams();
  const [launch, setLaunch] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState('ROCKET');
  const [loading, setLoading] = useState(true);

  const tabs = ['PAYLOAD', 'CREW', 'ROCKET', 'ENGINE', 'PROVIDER', 'PAD', 'HAZARDS', 'STATS'];

  useEffect(() => {
    fetchLaunch();
  }, [id]);

  useEffect(() => {
    if (launch?.launch_date) {
      startCountdown(launch.launch_date);
    }
  }, [launch]);

  const fetchLaunch = async () => {
    try {
      const [launchRes, storiesRes] = await Promise.all([
        axios.get(`${API_URL}/api/launches/${id}`),
        axios.get(`${API_URL}/api/news?limit=4&status=published`),
      ]);

      setLaunch(launchRes.data);
      
      // Handle API response format (may be array or { data: [...] })
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
          <Link to="/launches" className="text-orange-500 hover:text-orange-400">
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

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">LAUNCH</div>
      <div className="flex items-center gap-4 text-white">
        <Link to="/launches?tab=upcoming" className="hover:text-gray-300">UPCOMING</Link>
        <span>|</span>
        <Link to="/launches?tab=previous" className="hover:text-gray-300">PREVIOUS</Link>
        <span>|</span>
        <Link to="/events" className="hover:text-gray-300">EVENTS</Link>
        <span>|</span>
        <Link to="/launches?tab=statistics" className="hover:text-gray-300">STATISTICS</Link>
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Header Section */}
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-sm text-gray-400 mb-2">{formatDate(launch.launch_date)}</div>
          <h1 className="text-5xl md:text-7xl font-bold mb-2">{launch.name}</h1>
          <div className="text-lg text-gray-400">
            {launch.site || launch.launch_site?.name || 'Location TBD'} |{' '}
            {launch.site_country || launch.launch_site?.country || 'Country TBD'}
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="bg-black border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center gap-4 text-6xl md:text-8xl font-bold mb-4">
            <div className="text-center">
              <div>{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-sm text-gray-400 mt-2">DAYS</div>
            </div>
            <div className="text-gray-600">:</div>
            <div className="text-center">
              <div>{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-sm text-gray-400 mt-2">HOURS</div>
            </div>
            <div className="text-gray-600">:</div>
            <div className="text-center">
              <div>{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-sm text-gray-400 mt-2">MINUTES</div>
            </div>
            <div className="text-gray-600">:</div>
            <div className="text-center">
              <div>{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="text-sm text-gray-400 mt-2">SECONDS</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Live Stream */}
          <div className="md:col-span-2">
            <div className="bg-gray-900 p-6 mb-6">
              <div className="relative aspect-video bg-black mb-4">
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 py-1 text-sm font-bold">LIVE</span>
                  <span className="text-white font-semibold">THE LAUNCH PAD</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Live Stream Placeholder
                </div>
                <div className="absolute top-4 right-4 text-xs text-gray-500">TLPNETWORK.COM</div>
              </div>
              <div className="flex gap-4 justify-center">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">X</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">📷</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">@</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">🔗</span>
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 transition-colors ${
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
            <div className="bg-gray-900 p-6">
              <div className="prose prose-invert max-w-none">
                {launch.details || launch.mission_description ? (
                  <p>{launch.details || launch.mission_description}</p>
                ) : (
                  <p className="text-gray-400">
                    Detailed information about this launch is coming soon. Check back for updates on payload, crew, rocket specifications, and more.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Launch Overview */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">LIFT OFF TIME</h3>
              <div className="text-sm mb-4">
                {formatDate(launch.launch_date)}
              </div>
              <h3 className="text-xl font-bold mb-4 mt-6">LAUNCH WINDOW</h3>
              <div className="text-sm mb-2">
                {launch.launch_window_open
                  ? formatDate(launch.launch_window_open)
                  : launch.windows && launch.windows.length > 0
                  ? formatDate(launch.windows[0].window_open)
                  : 'TBD'}
              </div>
              <div className="text-sm text-gray-400">
                {launch.launch_window_close
                  ? formatDate(launch.launch_window_close)
                  : launch.windows && launch.windows.length > 0 && launch.windows[0].window_close
                  ? formatDate(launch.windows[0].window_close)
                  : 'TBD'}
              </div>
              <h3 className="text-xl font-bold mb-2 mt-6">LAUNCH FACILITY</h3>
              <div className="text-sm mb-4">{launch.site || launch.launch_site?.name || 'TBD'}</div>
              <h3 className="text-xl font-bold mb-2">LAUNCH PAD</h3>
              <div className="text-sm">{launch.pad_name || launch.launch_pad?.name || 'TBD'}</div>
            </div>

            {/* Payload Overview */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">PAYLOAD OVERVIEW</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">CUSTOMER:</span>{' '}
                  <span className="font-semibold">{launch.provider || launch.provider_id || 'TBD'}</span>
                </div>
                <div>
                  <span className="text-gray-400">PAYLOAD:</span>{' '}
                  <span className="font-semibold">
                    {launch.payloads && launch.payloads.length > 0
                      ? launch.payloads.map(p => p.name).join(', ')
                      : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">PAYLOAD MASS:</span>{' '}
                  <span className="font-semibold">
                    {launch.payloads && launch.payloads.length > 0
                      ? `${launch.payloads.reduce((sum, p) => sum + (parseFloat(p.mass_kg) || 0), 0)}kg`
                      : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">DESTINATION:</span>{' '}
                  <span className="font-semibold">{launch.orbit || 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Recovery Overview */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">RECOVERY OVERVIEW</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">LANDING LOCATION:</span>{' '}
                  <span className="font-semibold">TBD</span>
                </div>
                <div>
                  <span className="text-gray-400">LANDING TYPE:</span>{' '}
                  <span className="font-semibold">TBD</span>
                </div>
              </div>
            </div>

            {/* Related Stories */}
            {relatedStories.length > 0 && (
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold mb-4">RELATED STORIES</h3>
                <div className="space-y-4">
                  {relatedStories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/news/${story.slug || story.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="h-24 bg-gray-800 mb-2 rounded"></div>
                      <div className="text-sm font-semibold line-clamp-2">{story.title}</div>
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
