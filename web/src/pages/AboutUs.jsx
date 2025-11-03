import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import CrewCard from '../components/CrewCard';
import API_URL from '../config/api';
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const AboutUs = () => {
  const [crewMembers, setCrewMembers] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const categories = ['ALL', 'ADVISORS', 'PRODUCTION', 'JOURNALISTS', 'SPACE HISTORY WRITERS', 'ROCKETCHASERS', 'MODERATORS'];

  useEffect(() => {
    fetchCrew();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredCrew(crewMembers);
    } else {
      setFilteredCrew(crewMembers.filter(member => member.category === selectedCategory));
    }
  }, [selectedCategory, crewMembers]);

  const fetchCrew = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/crew`);
      setCrewMembers(response.data || []);
      setFilteredCrew(response.data || []);
    } catch (error) {
      console.error('Error fetching crew:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div
        className="relative h-[50vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6">ABOUT US</h1>
          <p className="text-xl max-w-3xl mx-auto">
            The Launch Pad Network's mission is to inform and inspire the explorers of tomorrow because we believe that space is better together. We strive to breakdown the complexity of space exploration and make it easy to understand and easy to access for everyone.
          </p>
        </div>
      </div>

      {/* OUR CREW Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-5xl font-bold mb-8">OUR CREW</h2>
        
        {/* World Map Placeholder */}
        <div className="bg-gray-900 p-8 mb-12 rounded">
          <div className="h-64 bg-gray-800 rounded relative">
            <div className="absolute top-1/4 left-1/4 text-white bg-red-600 px-3 py-1 rounded">
              TLP Network HQ
            </div>
            <div className="absolute top-1/3 left-1/3 text-white bg-red-600 px-3 py-1 rounded">
              TLP Space Coast
            </div>
            <div className="absolute top-1/4 left-2/3 text-white bg-blue-600 px-3 py-1 rounded">
              TLP Europe
            </div>
            <p className="absolute bottom-4 left-4 text-gray-400 text-sm">World Map with Crew Locations</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-8 pb-4 border-b border-gray-700">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 transition-colors ${
                selectedCategory === category
                  ? 'bg-white text-black font-semibold'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Crew Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading crew members...</div>
        ) : filteredCrew.length > 0 ? (
          <div className="grid md:grid-cols-4 gap-6">
            {filteredCrew.map((member) => (
              <CrewCard key={member.id} crewMember={member} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            No crew members found in this category.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AboutUs;
