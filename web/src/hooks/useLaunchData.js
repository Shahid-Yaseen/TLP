import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { buildLaunchFilters } from '../utils/filters';

/**
 * Custom hook for managing launch data fetching and filtering
 * @param {string} type - 'upcoming' or 'previous'
 */
export function useLaunchData(type = 'upcoming') {
  const [launches, setLaunches] = useState([]);
  const [heroLaunch, setHeroLaunch] = useState(null); // Hero launch (unfiltered by search)
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState(''); // Input value (doesn't trigger fetch)
  const [searchQuery, setSearchQuery] = useState(''); // Actual search query (triggers fetch)
  const [hideTBD, setHideTBD] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0, has_more: false });

  const fetchLaunchesWithPagination = async (paginationToUse = pagination, append = false) => {
    try {
      setLoading(true);
      
      // Build filter params
      const filterParams = buildLaunchFilters({
        ...filters,
        limit: paginationToUse.limit || 100,
        offset: paginationToUse.offset || 0,
      });

      // Add date filter based on type
      const now = new Date().toISOString();
      if (type === 'upcoming') {
        filterParams.net__gte = now;
        delete filterParams.net__lt;
      } else if (type === 'previous') {
        filterParams.net__lt = now;
        delete filterParams.net__gte;
      }

      // Add search query
      if (searchQuery) {
        filterParams.name = searchQuery;
        // Force sync from external API when searching
        filterParams.sync = 'true';
      }

      // Add region filter (map to country codes/names)
      if (regionFilter !== 'ALL') {
        const regionCountryMap = {
          AMERICA: { code: 'US', name: 'United States' },
          CANADA: { code: 'CA', name: 'Canada' },
          EUROPE: { code: null, name: null },
          RUSSIA: { code: 'RU', name: 'Russia' },
          CHINA: { code: 'CN', name: 'China' },
          INDIA: { code: 'IN', name: 'India' },
          'DOWN UNDER': { code: 'AU', name: 'Australia' },
          OTHER: { code: null, name: null },
        };
        
        const countryInfo = regionCountryMap[regionFilter];
        if (countryInfo) {
          if (countryInfo.code) {
            filterParams.country__code = countryInfo.code;
          } else if (countryInfo.name) {
            filterParams.country__name = countryInfo.name;
          } else if (regionFilter === 'EUROPE') {
            filterParams.country__code = 'FR,DE,IT,ES,GB,SE,NO';
          }
        }
      }

      // Hide TBD filter
      if (hideTBD) {
        filterParams.outcome = 'success,failure,partial';
      }

      const response = await axios.get(`${API_URL}/api/launches`, { params: filterParams });
      
      // Handle response format: { data: [...], pagination: {...} }
      const launchesData = response.data?.data || response.data || [];
      
      if (Array.isArray(launchesData)) {
        const sorted = launchesData.sort((a, b) => {
          const dateA = new Date(a.launch_date || 0).getTime();
          const dateB = new Date(b.launch_date || 0).getTime();
          return type === 'upcoming' 
            ? dateA - dateB  // Upcoming: ascending (soonest first)
            : dateB - dateA; // Previous: descending (most recent first)
        });
        
        if (append) {
          setLaunches(prev => [...prev, ...sorted]);
        } else {
          setLaunches(sorted);
        }
      } else {
        console.warn('Unexpected launches data format:', launchesData);
        if (!append) {
          setLaunches([]);
        }
      }
      
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching launches:', error);
      console.error('Error details:', error.response?.data || error.message);
      if (!append) {
        setLaunches([]);
      }
      setLoading(false);
    }
  };

  // Fetch hero launch (unfiltered by search, always the first launch)
  const fetchHeroLaunch = async () => {
    try {
      const filterParams = buildLaunchFilters({
        limit: 1,
        offset: 0,
      });

      // Add date filter based on type
      const now = new Date().toISOString();
      if (type === 'upcoming') {
        filterParams.net__gte = now;
        delete filterParams.net__lt;
      } else if (type === 'previous') {
        filterParams.net__lt = now;
        delete filterParams.net__gte;
      }

      // Hide TBD filter (but not search or other filters for hero)
      if (hideTBD) {
        filterParams.outcome = 'success,failure,partial';
      }

      const response = await axios.get(`${API_URL}/api/launches`, { params: filterParams });
      const launchesData = response.data?.data || response.data || [];
      
      if (Array.isArray(launchesData) && launchesData.length > 0) {
        const sorted = launchesData.sort((a, b) => {
          const dateA = new Date(a.launch_date || 0).getTime();
          const dateB = new Date(b.launch_date || 0).getTime();
          return type === 'upcoming' 
            ? dateA - dateB  // Upcoming: ascending (soonest first)
            : dateB - dateA; // Previous: descending (most recent first)
        });
        setHeroLaunch(sorted[0]);
      } else {
        setHeroLaunch(null);
      }
    } catch (error) {
      console.error('Error fetching hero launch:', error);
      setHeroLaunch(null);
    }
  };

  // Reset and fetch when filters change (but NOT searchQuery - that's triggered by button)
  useEffect(() => {
    const resetPagination = { total: 0, limit: 100, offset: 0, has_more: false };
    setPagination(resetPagination);
    setLaunches([]);
    fetchLaunchesWithPagination(resetPagination, false);
    // Also fetch hero launch (without search)
    fetchHeroLaunch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, filters, regionFilter, hideTBD]);

  // Fetch when searchQuery changes (triggered by search button)
  // Note: Hero launch is NOT affected by search
  useEffect(() => {
    if (searchQuery !== undefined) {
      const resetPagination = { total: 0, limit: 100, offset: 0, has_more: false };
      setPagination(resetPagination);
      setLaunches([]);
      fetchLaunchesWithPagination(resetPagination, false);
      // Don't fetch hero launch here - it should remain unchanged
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, offset: 0 });
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchInput('');
    setSearchQuery('');
    setRegionFilter('ALL');
    setHideTBD(false);
    setPagination({ ...pagination, offset: 0 });
  };

  const loadMore = () => {
    const newOffset = pagination.offset + pagination.limit;
    const newPagination = { ...pagination, offset: newOffset };
    setPagination(newPagination);
    fetchLaunchesWithPagination(newPagination, true); // Append mode
  };

  return {
    launches,
    heroLaunch, // Hero launch (unfiltered by search)
    loading,
    regionFilter,
    setRegionFilter,
    searchInput,
    setSearchInput,
    searchQuery,
    handleSearch,
    hideTBD,
    setHideTBD,
    filters,
    setFilters: handleFiltersChange,
    pagination,
    resetFilters: handleResetFilters,
    loadMore,
    fetchLaunchesWithPagination,
  };
}



