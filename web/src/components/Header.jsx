import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ sectionNav = null }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-black border-b-2 border-white">
        <div className="max-w-full mx-auto px-6 py-2 flex justify-between items-center text-xs text-white">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              TLP Network Inc.
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/launches" className="hover:text-gray-300 transition-colors">LAUNCH CENTER</Link>
            <span className="text-gray-500">|</span>
            <Link to="/news" className="hover:text-gray-300 transition-colors">TLP SPACE NEWS</Link>
            <span className="text-gray-500">|</span>
            <Link to="/mission" className="hover:text-gray-300 transition-colors">TLP MISSION</Link>
            <span className="text-gray-500">|</span>
            <Link to="/spacebase" className="hover:text-gray-300 transition-colors">SPACEBASE</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/about" className="hover:text-gray-300 transition-colors">ABOUT US</Link>
            <span className="text-gray-500">|</span>
            <Link to="/support" className="hover:text-gray-300 transition-colors">SUPPORT</Link>
            {isAuthenticated && (
              <>
                <span className="text-gray-500 ml-4">|</span>
                <div className="relative ml-2" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{user?.full_name || user?.email || 'PROFILE'}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded shadow-lg z-50">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-900 hover:text-white transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!isAuthenticated && (
              <>
                <span className="text-gray-500 ml-4">|</span>
                <Link to="/login" className="hover:text-gray-300 transition-colors ml-2">LOGIN</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section Navigation Bar (if provided) */}
      {sectionNav && sectionNav}
    </>
  );
};

export default Header;
