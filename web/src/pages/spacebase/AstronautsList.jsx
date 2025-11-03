import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';
import AstronautCard from '../../components/AstronautCard';

import API_URL from '../../config/api';

const AstronautsList = () => {
  const [astronauts, setAstronauts] = useState([]);
  const [filteredAstronauts, setFilteredAstronauts] = useState([]);
  const [featuredAstronaut, setFeaturedAstronaut] = useState(null);
  const [stats, setStats] = useState({ total: 0 });
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const regions = ['ALL', 'CANADA', 'AMERICA', 'EUROPE', 'DOWN UNDER', 'INDIA', 'RUSSIA', 'CHINA', 'OTHER'];

  useEffect(() => {
    fetchAstronauts();
    fetchAgencies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedRegion, selectedAgency, selectedStatus, selectedType, astronauts]);

  const fetchAstronauts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/astronauts`);
      // Handle API response format (may be array or { data: [...] })
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      setAstronauts(data);
      setFilteredAstronauts(data);
      setStats({ total: data.length });
      if (data.length > 0) {
        setFeaturedAstronaut(data[0]);
      }
    } catch (error) {
      console.error('Error fetching astronauts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/agencies`);
      setAgencies(response.data || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(astronauts)) {
      setFilteredAstronauts([]);
      return;
    }
    let filtered = [...astronauts];

    if (selectedRegion !== 'ALL') {
      // Filter by nationality/country based on region
      // This is a simplified mapping - you may need to adjust
      filtered = filtered.filter((astro) => {
        const country = (astro.nationality || '').toUpperCase();
        switch (selectedRegion) {
          case 'AMERICA':
            return country.includes('USA') || country.includes('AMERICAN');
          case 'EUROPE':
            return country.includes('UK') || country.includes('BRITISH') || country.includes('GERMAN');
          case 'RUSSIA':
            return country.includes('RUSSIAN');
          case 'CHINA':
            return country.includes('CHINESE');
          case 'INDIA':
            return country.includes('INDIAN');
          case 'CANADA':
            return country.includes('CANADIAN');
          default:
            return true;
        }
      });
    }

    if (selectedAgency) {
      filtered = filtered.filter((astro) => astro.agency_id === parseInt(selectedAgency));
    }

    if (selectedStatus) {
      filtered = filtered.filter((astro) => astro.status === selectedStatus.toLowerCase());
    }

    if (selectedType) {
      filtered = filtered.filter((astro) => astro.type === selectedType.toUpperCase());
    }

    setFilteredAstronauts(filtered);
  };

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">SPACEBASE</div>
      <div className="flex items-center gap-4 text-white">
        <Link to="/spacebase/rockets" className="hover:text-gray-300">ROCKETS</Link>
        <span>|</span>
        <Link to="/spacebase/engines" className="hover:text-gray-300">ENGINES</Link>
        <span>|</span>
        <span className="bg-white text-black px-3 py-1 font-semibold">SPACECRAFT</span>
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
      {/* Sub-navigation */}
      <div className="bg-black border-b border-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4 text-sm">
          <span className="text-gray-400">MOST POPULAR</span>
          <span className="text-orange-500">STARSHIP</span>
          <span className="text-orange-500">FALCON 9</span>
          <span className="text-orange-500">RS-25</span>
          <span className="text-orange-500">LC-39A</span>
          <span className="text-orange-500">CHRIS HADFIELD</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 transition-colors ${
                  selectedRegion === region
                    ? 'bg-white text-black font-semibold'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="bg-gray-900 text-white border border-gray-700 px-4 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">Agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-900 text-white border border-gray-700 px-4 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="retired">Retired</option>
              <option value="deceased">Deceased</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-gray-900 text-white border border-gray-700 px-4 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">Type</option>
              <option value="NASA">NASA</option>
              <option value="private">Private</option>
              <option value="international">International</option>
            </select>
            <input
              type="text"
              placeholder="SEARCH"
              className="bg-gray-900 text-white border border-gray-700 px-4 py-2 focus:outline-none focus:border-orange-500 ml-auto"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* ASTRO STATS */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-2">ASTRO STATS</h3>
              <div className="text-4xl font-bold mb-1">{stats.total}</div>
              <div className="text-gray-400">TOTAL ASTRONAUTS</div>
            </div>

            {/* ASTRO OF THE DAY */}
            {featuredAstronaut && (
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold mb-4">ASTRO OF THE DAY</h3>
                <AstronautCard astronaut={featuredAstronaut} featured={true} />
              </div>
            )}
          </div>

          {/* Main Grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading astronauts...</div>
            ) : filteredAstronauts.length > 0 ? (
              <div className="grid md:grid-cols-4 gap-6">
                {filteredAstronauts.map((astronaut) => (
                  <AstronautCard key={astronaut.id} astronaut={astronaut} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">No astronauts found</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AstronautsList;
