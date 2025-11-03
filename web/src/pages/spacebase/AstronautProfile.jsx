import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

import API_URL from '../../config/api';
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const AstronautProfile = () => {
  const { id } = useParams();
  const [astronaut, setAstronaut] = useState(null);
  const [activeTab, setActiveTab] = useState('ROCKET');
  const [loading, setLoading] = useState(true);

  const tabs = ['PAYLOAD', 'CREW', 'ROCKET', 'ENGINE', 'PROVIDER', 'PAD', 'HAZARDS', 'STATS'];

  useEffect(() => {
    fetchAstronaut();
  }, [id]);

  const fetchAstronaut = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/astronauts/${id}`);
      setAstronaut(response.data);
    } catch (error) {
      console.error('Error fetching astronaut:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading astronaut profile...
        </div>
      </Layout>
    );
  }

  if (!astronaut) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Astronaut Not Found</h1>
          <Link to="/spacebase/astronauts" className="text-orange-500 hover:text-orange-400">
            Return to Astronauts
          </Link>
        </div>
      </Layout>
    );
  }

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">SPACEBASE</div>
      <div className="flex items-center gap-4 text-white">
        <Link to="/spacebase/rockets" className="hover:text-gray-300">ROCKETS</Link>
        <span>|</span>
        <Link to="/spacebase/engines" className="hover:text-gray-300">ENGINES</Link>
        <span>|</span>
        <Link to="/spacebase/spacecraft" className="hover:text-gray-300">SPACECRAFT</Link>
        <span>|</span>
        <Link to="/spacebase/facilities" className="hover:text-gray-300">FACILITIES</Link>
        <span>|</span>
        <Link to="/spacebase/pads" className="hover:text-gray-300">PADS</Link>
        <span>|</span>
        <Link to="/spacebase/agencies" className="hover:text-gray-300">AGENCIES</Link>
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Hero Section */}
      <div
        className="relative h-[50vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-6xl md:text-8xl font-bold">
            {astronaut.full_name || `${astronaut.first_name} ${astronaut.last_name}`}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* ASTRO OVERVIEW */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">ASTRO OVERVIEW</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Gender:</span>{' '}
                  <span className="font-semibold">{astronaut.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Nationality:</span>{' '}
                  <span className="font-semibold">{astronaut.nationality || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Hometown:</span>{' '}
                  <span className="font-semibold">{astronaut.hometown || 'N/A'}</span>
                </div>
                {astronaut.birth_date && (
                  <div>
                    <span className="text-gray-400">Age:</span>{' '}
                    <span className="font-semibold">
                      {new Date().getFullYear() - new Date(astronaut.birth_date).getFullYear()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MISSIONS */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">MISSIONS</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 p-3">
                    <div className="h-24 bg-gray-700 mb-2 rounded"></div>
                    <div className="text-sm font-semibold">UNITED LAUNCH ALLIANCE</div>
                    <div className="text-xs text-gray-400">CREWED FLIGHT TEST</div>
                    <div className="text-xs text-gray-500">Rego Mission: 00, 0000</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div>
            {/* Astronaut Photo */}
            <div className="mb-6">
              <img
                src={astronaut.profile_image_url || 'https://via.placeholder.com/400x500/1a1a1a/ffffff?text=Astronaut'}
                alt={astronaut.full_name}
                className="w-full h-auto"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x500/1a1a1a/ffffff?text=Astronaut';
                }}
              />
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
                {astronaut.biography ? (
                  <p>{astronaut.biography}</p>
                ) : (
                  <p className="text-gray-400">
                    Biography information coming soon. This astronaut has made significant contributions to space exploration.
                  </p>
                )}
                <p className="mt-4">
                  The Space Development Agency (SDA) wants to give commercial space companies a chance to prove their mettle for future military satellite contracts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Social Sharing */}
            <div className="bg-gray-900 p-6">
              <div className="flex gap-4 justify-center mb-6">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">X</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">@</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">🔗</span>
                </a>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">ASTRONAUT #{astronaut.astronaut_number || astronaut.id}</div>
                <div className={`mb-2 ${astronaut.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>
                  STATUS: {astronaut.status?.toUpperCase() || 'N/A'}
                </div>
                <div className="text-sm text-gray-400">TYPE: {astronaut.type?.toUpperCase() || 'N/A'}</div>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">SUMMARY</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">NASA TO CANCEL SPACE LAUNCH SYSTEM AND ARTEMIS PROGRAM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">NASA BLOWS UP ROCKET AT NASA KSC MUSEUM BY MISTAKE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">SLS TRIPS ON NSF VAN DURING ROLLOUT</span>
                </li>
              </ul>
            </div>

            {/* ASTRO ACHIEVEMENTS */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">ASTRO ACHIEVEMENTS</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-full h-16 bg-gray-800 rounded flex items-center justify-center"
                  >
                    <span className="text-2xl">🚀</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="w-8 h-8 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AstronautProfile;
