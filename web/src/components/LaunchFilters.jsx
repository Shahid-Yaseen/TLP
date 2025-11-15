import { useState, useEffect, useRef } from 'react';
import { buildLaunchFilters } from '../utils/filters';
import axios from 'axios';
import API_URL from '../config/api';

const LaunchFilters = ({ filters, onFiltersChange, onReset }) => {
  const [isOpen, setIsOpen] = useState({
    launchSite: false,
    launchProvider: false,
    rocket: false,
    missionType: false,
  });

  const [options, setOptions] = useState({
    launchSites: [],
    providers: [],
    rockets: [],
    missionTypes: [],
  });

  const dropdownRefs = {
    launchSite: useRef(null),
    launchProvider: useRef(null),
    rocket: useRef(null),
    missionType: useRef(null),
  };

  useEffect(() => {
    // Fetch filter options
    fetchFilterOptions();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      Object.values(dropdownRefs).forEach(ref => {
        if (ref.current && !ref.current.contains(event.target)) {
          setIsOpen(prev => ({ ...prev, [ref.current.dataset.dropdown]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFilterOptions = async () => {
    try {
      // Fetch unique values for dropdowns
      // These would ideally come from dedicated endpoints, but we can extract from launches
      const response = await axios.get(`${API_URL}/api/launches?limit=1000`);
      const launches = response.data?.data || response.data || [];
      
      const sites = [...new Set(launches.map(l => l.site).filter(Boolean))].sort();
      const providers = [...new Set(launches.map(l => l.provider).filter(Boolean))].sort();
      const rockets = [...new Set(launches.map(l => l.rocket).filter(Boolean))].sort();
      const missionTypes = [...new Set(launches.map(l => l.mission_type).filter(Boolean))].sort();

      setOptions({
        launchSites: sites,
        providers: providers,
        rockets: rockets,
        missionTypes: missionTypes,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const toggleDropdown = (name) => {
    setIsOpen(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className="bg-white py-1">
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 flex-wrap">
          {/* Launch Site Dropdown */}
          <div 
            ref={dropdownRefs.launchSite}
            data-dropdown="launchSite"
            className="relative cursor-pointer"
          >
          <div className="flex flex-col" onClick={() => toggleDropdown('launchSite')}>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                Launch Site {filters.pad__location || filters.site ? '✓' : ''}
              </span>
              <span className="text-gray-400 text-[10px] sm:text-xs leading-none">▼</span>
            </div>
            <div className="w-full h-px bg-gray-300 mt-1"></div>
          </div>
          {isOpen.launchSite && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px] sm:min-w-[200px]">
              <input
                type="text"
                placeholder="Search site..."
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-200 text-[10px] sm:text-xs text-gray-900 placeholder-gray-400"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  // Filter options based on search
                }}
              />
              <div
                className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900 font-semibold border-b border-gray-200"
                onClick={() => {
                  handleFilterChange('pad__location', null);
                  setIsOpen(prev => ({ ...prev, launchSite: false }));
                }}
              >
                All
              </div>
              {options.launchSites.map((site) => (
                <div
                  key={site}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900"
                  onClick={() => {
                    handleFilterChange('pad__location', site);
                    setIsOpen(prev => ({ ...prev, launchSite: false }));
                  }}
                >
                  {site}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch Provider Dropdown */}
        <div 
          ref={dropdownRefs.launchProvider}
          data-dropdown="launchProvider"
          className="relative cursor-pointer"
        >
          <div className="flex flex-col" onClick={() => toggleDropdown('launchProvider')}>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                Launch Provider {filters.lsp__name || filters.provider ? '✓' : ''}
              </span>
              <span className="text-gray-400 text-[10px] sm:text-xs leading-none">▼</span>
            </div>
            <div className="w-full h-px bg-gray-300 mt-1"></div>
          </div>
          {isOpen.launchProvider && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px] sm:min-w-[200px]">
              <div
                className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900 font-semibold border-b border-gray-200"
                onClick={() => {
                  handleFilterChange('lsp__name', null);
                  setIsOpen(prev => ({ ...prev, launchProvider: false }));
                }}
              >
                All
              </div>
              {options.providers.map((provider) => (
                <div
                  key={provider}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900"
                  onClick={() => {
                    handleFilterChange('lsp__name', provider);
                    setIsOpen(prev => ({ ...prev, launchProvider: false }));
                  }}
                >
                  {provider}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rocket Dropdown */}
        <div 
          ref={dropdownRefs.rocket}
          data-dropdown="rocket"
          className="relative cursor-pointer"
        >
          <div className="flex flex-col" onClick={() => toggleDropdown('rocket')}>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                Rocket {filters.rocket__configuration__name__icontains || filters.rocket ? '✓' : ''}
              </span>
              <span className="text-gray-400 text-[10px] sm:text-xs leading-none">▼</span>
            </div>
            <div className="w-full h-px bg-gray-300 mt-1"></div>
          </div>
          {isOpen.rocket && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px] sm:min-w-[200px]">
              <div
                className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900 font-semibold border-b border-gray-200"
                onClick={() => {
                  handleFilterChange('rocket__configuration__name__icontains', null);
                  setIsOpen(prev => ({ ...prev, rocket: false }));
                }}
              >
                All
              </div>
              {options.rockets.map((rocket) => (
                <div
                  key={rocket}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900"
                  onClick={() => {
                    handleFilterChange('rocket__configuration__name__icontains', rocket);
                    setIsOpen(prev => ({ ...prev, rocket: false }));
                  }}
                >
                  {rocket}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mission Type Dropdown */}
        <div 
          ref={dropdownRefs.missionType}
          data-dropdown="missionType"
          className="relative cursor-pointer"
        >
          <div className="flex flex-col" onClick={() => toggleDropdown('missionType')}>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-[10px] sm:text-xs">
                Mission Type {filters.mission_type ? '✓' : ''}
              </span>
              <span className="text-gray-400 text-[10px] sm:text-xs leading-none">▼</span>
            </div>
            <div className="w-full h-px bg-gray-300 mt-1"></div>
          </div>
          {isOpen.missionType && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto min-w-[150px] sm:min-w-[200px]">
              <div
                className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900 font-semibold border-b border-gray-200"
                onClick={() => {
                  handleFilterChange('mission_type', null);
                  setIsOpen(prev => ({ ...prev, missionType: false }));
                }}
              >
                All
              </div>
              {options.missionTypes.map((type) => (
                <div
                  key={type}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 cursor-pointer text-[10px] sm:text-xs text-gray-900"
                  onClick={() => {
                    handleFilterChange('mission_type', type);
                    setIsOpen(prev => ({ ...prev, missionType: false }));
                  }}
                >
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Reset Button */}
          {(filters.pad__location || filters.lsp__name || filters.rocket__configuration__name__icontains || filters.mission_type) && (
            <button
              onClick={handleReset}
              className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchFilters;

