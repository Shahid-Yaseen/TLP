import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';

const Mission = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [missionData, setMissionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, ''));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMissionData();
  }, []);

  const fetchMissionData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/mission`);
      setMissionData(response.data);
    } catch (error) {
      console.error('Error fetching mission data:', error);
      // Set default values if API fails
      setMissionData({
        hero_title: 'LunEx-1',
        hero_subtitle: 'LAUNCHING JULY 2026',
        hero_mission_statement: 'LunEx-1 is The Launch Pad\'s first mission off planet; and we want you to come with us!',
        hero_background_image_url: 'https://images.unsplash.com/photo-1614730321146-b6fa6efe46c1?w=1920&q=80',
        button1_text: 'SEND YOUR NAME',
        button1_status_text: 'SUBMISSIONS CLOSED',
        button2_text: 'SEND YOUR PHOTO',
        button2_status_text: 'SUBMISSIONS CLOSED',
        button3_text: 'SEND YOUR VIDEO',
        button3_status_text: 'SUBMISSIONS CLOSED',
        lift_off_time: 'NET JULY 2026',
        launch_facility: 'NASA KENNEDY SPACE CENTER',
        launch_pad: 'LC-39A',
        launch_provider: 'SPACEX',
        rocket: 'FALCON HEAVY',
        lander_provider: 'ASTROBOTIC',
        lunar_lander: 'GRIFFIN',
        updates: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Header Bar */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-full mx-auto px-4 md:px-6 py-2 flex justify-between items-center text-xs text-gray-400">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <span>TLP Network Inc.</span>
            <span>|</span>
            <Link to="/launches/upcoming" className="hover:text-white transition-colors">LAUNCH CENTER</Link>
            <span>|</span>
            <Link to="/news" className="hover:text-white transition-colors">TLP SPACE NEWS</Link>
            <span>|</span>
            <Link to="/spacebase" className="hover:text-white transition-colors">SPACEBASE</Link>
            <span>|</span>
            <Link to="/mission" className="text-white transition-colors">TLP MISSIONS</Link>
            <span>|</span>
            <a href="https://thelaunchpad.store" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SHOP</a>
            <span>|</span>
            <Link to="/navigator/advanced" className="hover:text-white transition-colors">3D ORBIT NAVIGATOR</Link>
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
          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/about" className="hover:text-white transition-colors">ABOUT US</Link>
            <span>|</span>
            <Link to="/support" className="hover:text-white transition-colors">SUPPORT</Link>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800 px-4 py-3 space-y-2">
            <Link to="/launches/upcoming" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>LAUNCH CENTER</Link>
            <Link to="/news" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>TLP SPACE NEWS</Link>
            <Link to="/spacebase" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>SPACEBASE</Link>
            <Link to="/mission" className="block text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>TLP MISSIONS</Link>
            <a href="https://thelaunchpad.store" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">SHOP</a>
            <Link to="/navigator/advanced" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>3D ORBIT NAVIGATOR</Link>
            <div className="border-t border-gray-800 pt-2 mt-2">
              <Link to="/about" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>ABOUT US</Link>
              <Link to="/support" className="block text-gray-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>SUPPORT</Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#595959] border-t-2 border-white">
        <div className="max-w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-2 md:gap-3">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-1 sm:gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>MISSIONS</h1>
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>{missionData?.hero_title || 'LunEx-1'}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {!loading && missionData && (
        <div
          className="relative w-full h-[70vh] md:h-[80vh] lg:h-[85vh] bg-cover bg-center flex items-center justify-center"
          style={{ 
            backgroundImage: `url('${missionData.hero_background_image_url || 'https://images.unsplash.com/photo-1614730321146-b6fa6efe46c1?w=1920&q=80'}')`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-bold uppercase text-white mb-3 md:mb-4 px-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              {missionData.hero_title || 'LunEx-1'}
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-xl lg:text-2xl xl:text-3xl text-white mb-6 md:mb-8 uppercase tracking-wide font-light px-2">
              {missionData.hero_subtitle || 'LAUNCHING JULY 2026'}
            </p>
            
            {/* Mission Statement Box */}
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6 md:mb-10 w-full max-w-6xl mx-auto">
              <p className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-white leading-relaxed text-center">
                {missionData.hero_mission_statement || 'LunEx-1 is The Launch Pad\'s first mission off planet; and we want you to come with us!'}
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 lg:gap-6 justify-center items-center px-2">
              <button 
                className="bg-[#8B1A1A] text-white font-bold py-3 md:py-4 px-6 md:px-8 uppercase w-full sm:w-auto flex flex-col items-center justify-center"
                style={{ 
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none',
                  fontFamily: 'sans-serif',
                  cursor: 'default'
                }}
              >
                <span className="text-sm md:text-base lg:text-lg">{missionData.button1_text || 'SEND YOUR NAME'}</span>
                <span className="text-[10px] md:text-xs mt-1 font-normal">{missionData.button1_status_text || 'SUBMISSIONS CLOSED'}</span>
              </button>
              <button 
                className="bg-[#8B1A1A] text-white font-bold py-3 md:py-4 px-6 md:px-8 uppercase w-full sm:w-auto flex flex-col items-center justify-center"
                style={{ 
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none',
                  fontFamily: 'sans-serif',
                  cursor: 'default'
                }}
              >
                <span className="text-sm md:text-base lg:text-lg">{missionData.button2_text || 'SEND YOUR PHOTO'}</span>
                <span className="text-[10px] md:text-xs mt-1 font-normal">{missionData.button2_status_text || 'SUBMISSIONS CLOSED'}</span>
              </button>
              <button 
                className="bg-[#8B1A1A] text-white font-bold py-3 md:py-4 px-6 md:px-8 uppercase w-full sm:w-auto flex flex-col items-center justify-center"
                style={{ 
                  borderRadius: 0,
                  boxShadow: 'none',
                  border: 'none',
                  fontFamily: 'sans-serif',
                  cursor: 'default'
                }}
              >
                <span className="text-sm md:text-base lg:text-lg">{missionData.button3_text || 'SEND YOUR VIDEO'}</span>
                <span className="text-[10px] md:text-xs mt-1 font-normal">{missionData.button3_status_text || 'SUBMISSIONS CLOSED'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Sections - Three Columns */}
      {!loading && missionData && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Left Column: MISSION OVERVIEW */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A] self-start">
              <h3 className="text-base md:text-lg lg:text-xl font-bold py-2 md:py-3 px-3 md:px-4 text-center text-white uppercase">MISSION OVERVIEW</h3>
              <div className="p-3 md:p-4 space-y-2 md:space-y-3 text-xs md:text-sm">
                {/* First Section */}
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LIFT OFF TIME:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.lift_off_time || 'NET JULY 2026'}</div>
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LAUNCH FACILITY:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.launch_facility || 'NASA KENNEDY SPACE CENTER'}</div>
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LAUNCH PAD:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.launch_pad || 'LC-39A'}</div>
                </div>
                
                {/* Horizontal separator */}
                <div className="border-t border-gray-600 my-3"></div>
                
                {/* Second Section (duplicate) */}
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LAUNCH FACILITY:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.launch_facility || 'NASA KENNEDY SPACE CENTER'}</div>
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LAUNCH PAD:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.launch_pad || 'LC-39A'}</div>
                </div>
                
                {/* Horizontal separator */}
                <div className="border-t border-gray-600 my-3"></div>
                
                {/* Third Section */}
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LAUNCH PROVIDER:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.launch_provider || 'SPACEX'}</div>
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">ROCKET:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.rocket || 'FALCON HEAVY'}</div>
                </div>
              </div>
            </div>

            {/* Middle Column: LATEST UPDATES */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A] md:col-span-2">
              <h3 className="text-base md:text-lg lg:text-xl font-bold py-2 md:py-3 px-3 md:px-4 text-center text-white uppercase bg-[#8B1A1A]">LATEST UPDATES</h3>
              <div className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  {missionData.updates && missionData.updates.length > 0 ? (
                    missionData.updates.map((update, index) => (
                      <div key={update.id || index} className="border-b border-gray-600 pb-3 md:pb-4 last:border-b-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-1 sm:gap-2">
                          <h4 className="text-white font-semibold text-sm md:text-base">{update.title || 'Update'}</h4>
                          {update.date && (
                            <p className="text-white text-[10px] md:text-xs uppercase tracking-wider">
                              {new Date(update.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        {update.description && (
                          <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                            {update.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">No updates available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: LANDER OVERVIEW */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A] self-start">
              <h3 className="text-base md:text-lg lg:text-xl font-bold py-2 md:py-3 px-3 md:px-4 text-center text-white uppercase">
                LANDER OVERVIEW
              </h3>
              <div className="p-3 md:p-4 space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-center justify-center h-32 md:h-40 lg:h-48 border border-gray-700">
                  {missionData.lander_image_url ? (
                    <img src={missionData.lander_image_url} alt="Lander" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-gray-500 text-xs md:text-sm">Lander Illustration</div>
                  )}
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">PROVIDER:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.lander_provider || 'ASTROBOTIC'}</div>
                </div>
                <div className="flex items-start relative">
                  <span className="text-white font-semibold flex-1 text-right pr-3">LUNAR LANDER:</span>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8B1A1A] transform -translate-x-1/2"></div>
                  <div className="text-white flex-1 pl-3">{missionData.lunar_lander || 'GRIFFIN'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mission;

