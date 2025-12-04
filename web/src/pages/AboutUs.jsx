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
    } else {
      setFilteredCrew(crewMembers.filter(member => member.category === selectedCategory));
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
      {/* Top Header Bar */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-full mx-auto px-4 md:px-6 py-2 flex justify-between items-center text-xs text-gray-400">
          {/* Desktop Navigation - Just TLP Network Inc. */}
          <div className="hidden md:flex items-center gap-2">
            <span>TLP Network Inc.</span>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800 px-4 py-3 space-y-2">
            <Link to="/launches/upcoming" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>LAUNCH CENTER</Link>
            <Link to="/news" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>TLP SPACE NEWS</Link>
            <Link to="/mission" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>TLP MISSION</Link>
            <Link to="/spacebase/astronauts" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>SPACEBASE</Link>
            <span className="block text-gray-400 cursor-pointer hover:text-white transition-colors">SHOP</span>
            <Link to="/navigator/advanced" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>3D ORBIT NAVIGATOR</Link>
            <div className="border-t border-gray-800 pt-2 mt-2">
              <Link to="/about" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>ABOUT US</Link>
              <span className="block text-gray-400 cursor-pointer hover:text-white transition-colors">SUPPORT</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-transparent border-t-2 border-transparent">
        <div className="max-w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Left Side: Helmet, Time, and Navigation Links */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Logo Section */}
            <div className="relative" style={{ overflow: 'visible' }}>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="/TLP Helmet.png" 
                  alt="TLP Logo" 
                  className="w-7 h-7 md:w-10 md:h-10 object-contain"
                />
              </div>
              <div className="absolute top-full left-0 bg-[#8B1A1A] px-1.5 md:px-2 py-0.5 text-[8px] md:text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '')}
              </div>
            </div>
            {/* Navigation Links - Right next to helmet */}
            <div className="hidden md:flex items-center gap-2 text-sm text-white">
              <Link to="/launches/upcoming" className="px-3 py-2 hover:text-gray-300 transition-colors">LAUNCH CENTER</Link>
              <span className="text-gray-600">|</span>
              <Link to="/news" className="px-3 py-2 hover:text-gray-300 transition-colors">TLP SPACE NEWS</Link>
              <span className="text-gray-600">|</span>
              <Link to="/mission" className="px-3 py-2 hover:text-gray-300 transition-colors">TLP MISSION</Link>
              <span className="text-gray-600">|</span>
              <Link to="/spacebase/astronauts" className="px-3 py-2 hover:text-gray-300 transition-colors">SPACEBASE</Link>
              <span className="text-gray-600">|</span>
              <span className="px-3 py-2 cursor-pointer hover:text-gray-300 transition-colors">SHOP</span>
              <span className="text-gray-600">|</span>
              <Link to="/navigator/advanced" className="px-3 py-2 hover:text-gray-300 transition-colors">3D ORBIT NAVIGATOR</Link>
            </div>
          </div>
          {/* Right Side: ABOUT US and SUPPORT */}
          <div className="hidden md:flex items-center gap-2 text-sm text-white">
            <Link to="/about" className="px-3 py-2 hover:text-gray-300 transition-colors">ABOUT US</Link>
            <span className="text-gray-600">|</span>
            <span className="px-3 py-2 cursor-pointer hover:text-gray-300 transition-colors">SUPPORT</span>
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
          <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full rounded overflow-hidden relative">
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
              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm uppercase font-sans transition-colors border-0 whitespace-nowrap shrink-0 ${
                selectedCategory === category
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
