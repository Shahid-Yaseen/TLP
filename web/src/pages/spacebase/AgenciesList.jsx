import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const AgenciesList = () => {
  const { setSectionNav } = useOutletContext();
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCountry, searchTerm, agencies]);

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/agencies`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setAgencies(data);
      setFilteredAgencies(data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(agencies)) {
      setFilteredAgencies([]);
      return;
    }
    let filtered = [...agencies];

    if (selectedCountry !== 'ALL') {
      filtered = filtered.filter(agency =>
        agency.country && agency.country.toLowerCase() === selectedCountry.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agency.abbreviation && agency.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredAgencies(filtered);
  };

  const countries = [...new Set(agencies.map(a => a.country).filter(Boolean))].sort();

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
        <span className="bg-white text-black px-3 py-1 font-semibold">AGENCIES</span>
      </div>
    </div>
  );

  useEffect(() => {
    setSectionNav(sectionNav);
    return () => setSectionNav(null);
  }, []);

  if (loading) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading agencies...
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="bg-black border-b border-gray-800 py-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">AGENCY STATS</div>
          <div className="text-gray-400">Total Agencies: {filteredAgencies.length}</div>
        </div>

        {/* Agencies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <Link
              key={agency.id}
              to={`/spacebase/agencies/${agency.id}`}
              className="bg-gray-900 hover:bg-gray-800 transition-colors p-6 border border-gray-800"
            >
              <div className="flex items-start gap-4 mb-4">
                {agency.logo_url && (
                  <img src={agency.logo_url} alt={agency.name} className="w-16 h-16 object-contain" />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{agency.name}</h3>
                  {agency.abbreviation && (
                    <div className="text-sm text-orange-500 font-semibold mb-2">{agency.abbreviation}</div>
                  )}
                  {agency.country && (
                    <div className="text-xs text-gray-400">{agency.country}</div>
                  )}
                </div>
              </div>
              {agency.founded_date && (
                <div className="text-xs text-gray-500">
                  Founded: {new Date(agency.founded_date).getFullYear()}
                </div>
              )}
            </Link>
          ))}
        </div>

        {filteredAgencies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No agencies found.
          </div>
        )}
      </div>
    </>
  );
};

export default AgenciesList;
