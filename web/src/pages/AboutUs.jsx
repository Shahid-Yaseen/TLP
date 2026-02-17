import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CrewCard from '../components/CrewCard';
import WorldMap from '../components/WorldMap';
import API_URL from '../config/api';
const HERO_BG_IMAGE = '/electron_image_20190705175640.jpeg';

const AboutUs = () => {
  const [crewMembers, setCrewMembers] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = ['ALL', 'ADVISORS', 'PRODUCTION', 'JOURNALISTS', 'SPACE HISTORY WRITERS', 'ROCKETCHASERS', 'MODERATORS'];

  useEffect(() => {
    fetchCrew();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, ''));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredCrew(crewMembers);
      console.log(`[AboutUs] Filter: ALL - Showing ${crewMembers.length} crew members`);
    } else {
      // Normalize category comparison: case-insensitive and trim whitespace
      const filtered = crewMembers.filter(member => {
        if (!member.category) return false;
        const memberCategory = member.category.toString().trim().toUpperCase();
        const selectedCat = selectedCategory.trim().toUpperCase();
        return memberCategory === selectedCat;
      });
      setFilteredCrew(filtered);
      console.log(`[AboutUs] Filter: ${selectedCategory} - Showing ${filtered.length} of ${crewMembers.length} crew members`);
    }
  }, [selectedCategory, crewMembers]);

  const fetchCrew = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/crew`);
      // Handle both response.data.data (paginated) and response.data (array) formats
      const crewData = response.data?.data || response.data || [];
      setCrewMembers(Array.isArray(crewData) ? crewData : []);
      setFilteredCrew(Array.isArray(crewData) ? crewData : []);
    } catch (error) {
      console.error('Error fetching crew:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Main Navigation Bar */}
      <div className="bg-black border-t-2 border-white">
        <div className="max-w-full mx-4 sm:mx-6 md:mx-8 px-3 sm:px-6 py-2 sm:py-0">
          <div className="flex items-center justify-between">
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
                  {currentTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '')}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>ABOUT US</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] bg-cover bg-center flex items-start justify-center pt-[150px] md:pt-[250px] lg:pt-[350px] xl:pt-[450px]"
        style={{
          backgroundImage: `url(${HERO_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>
        <div className="relative z-10 text-center w-full h-full flex items-center justify-center">
          <div
            className="w-full h-full flex flex-col justify-center"
            style={{
              width: '100vw',
              marginLeft: 'calc(50% - 50vw)',
              marginRight: 'calc(50% - 50vw)',
              paddingLeft: 0,
              paddingRight: 0,
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.95))'
            }}
          >
            <div className="py-2 md:py-4">
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold uppercase text-white px-4" style={{ fontFamily: 'Nasalization, sans-serif', opacity: 1.0 }}>ABOUT US</h1>
            </div>
            <div className="py-2 md:py-4">
              <p className="text-base md:text-lg lg:text-xl text-white px-4 md:px-6 mx-auto" style={{ maxWidth: '768px' }}>
                The Launch Pad Network's mission is to inform and inspire the explorers of tomorrow because we believe that space is better together. We strive to breakdown the complexity of space exploration and make it easy to understand and easy to access for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OUR CREW Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 mt-8 md:mt-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-center uppercase px-4" style={{ fontFamily: 'Nasalization, sans-serif' }}>OUR CREW</h2>

        {/* World Map */}
        <div className="bg-black p-4 md:p-6 lg:p-8 mb-8 md:mb-12 rounded">
          <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full rounded overflow-hidden relative" style={{ minHeight: '300px' }}>
            <WorldMap crewMembers={crewMembers} />
          </div>
        </div>
      </div>

      {/* Category Filter - Horizontal black navigation bar - Full width */}
      <div className="bg-black w-full border-b-2 border-white mt-6 md:mt-8">
        <div className="flex items-center overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-12 xl:px-16">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm uppercase font-sans transition-colors border-0 whitespace-nowrap shrink-0 ${selectedCategory === category
                  ? 'bg-white text-black font-semibold'
                  : 'bg-black text-white hover:text-gray-300'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Crew Grid Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Crew Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading crew members...</div>
        ) : filteredCrew.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-2">
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
    </div>
  );
};

export default AboutUs;
