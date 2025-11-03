import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ sectionNav = null }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

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

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-full mx-auto px-6 py-2 flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>TLP Network Inc.</span>
            <span className="text-gray-600">|</span>
            <Link to="/launches" className="hover:text-white transition-colors">LAUNCH CENTER</Link>
            <span className="text-gray-600">|</span>
            <Link to="/news" className="hover:text-white transition-colors">TLP SPACE NEWS</Link>
            <span className="text-gray-600">|</span>
            <Link to="/spacebase/astronauts" className="hover:text-white transition-colors">SPACEBASE</Link>
            <span className="text-gray-600">|</span>
            <span className="cursor-pointer hover:text-white transition-colors">SHOP</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/about" className="hover:text-white transition-colors">ABOUT US</Link>
            <span className="text-gray-600">|</span>
            <span className="cursor-pointer hover:text-white transition-colors">SUPPORT</span>
            <span className="text-gray-600 ml-4">|</span>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:text-white transition-colors ml-2">
                  {user?.full_name || user?.email || 'PROFILE'}
                </Link>
                <span className="text-gray-600">|</span>
                <button
                  onClick={logout}
                  className="hover:text-white transition-colors ml-2"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-white transition-colors ml-2">LOGIN</Link>
            )}
          </div>
        </div>
      </div>

      {/* Section Navigation Bar (if provided) */}
      {sectionNav && (
        <div className="bg-[#8B1A1A] border-t-2 border-white">
          <div className="max-w-full mx-auto px-6 py-3">
            {sectionNav}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
