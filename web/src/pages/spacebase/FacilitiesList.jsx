import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

import API_URL from '../../config/api';

const FacilitiesList = () => {
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
    fetchAgencies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedAgency, selectedType, searchTerm, facilities]);

  const fetchFacilities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/facilities`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setFacilities(data);
      setFilteredFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
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
    if (!Array.isArray(facilities)) {
      setFilteredFacilities([]);
      return;
    }
    let filtered = [...facilities];

    if (selectedAgency !== 'ALL') {
      filtered = filtered.filter(f => f.agency_id === parseInt(selectedAgency));
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(f => f.facility_type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredFacilities(filtered);
  };

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
        <span className="bg-white text-black px-3 py-1 font-semibold">FACILITIES</span>
        <span>|</span>
        <Link to="/spacebase/pads" className="hover:text-gray-300">PADS</Link>
        <span>|</span>
        <Link to="/spacebase/agencies" className="hover:text-gray-300">AGENCIES</Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout sectionNav={sectionNav}>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading facilities...
        </div>
      </Layout>
    );
  }

  return (
    <Layout sectionNav={sectionNav}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="bg-black border-b border-gray-800 py-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Agencies</option>
              {agencies.map(agency => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Types</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="control center">Control Center</option>
              <option value="museum">Museum</option>
            </select>
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">FACILITY STATS</div>
          <div className="text-gray-400">Total Facilities: {filteredFacilities.length}</div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Link
              key={facility.id}
              to={`/spacebase/facilities/${facility.id}`}
              className="bg-gray-900 hover:bg-gray-800 transition-colors p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-2">{facility.name}</h3>
              <div className="text-sm text-gray-400 mb-4">{facility.agency_name || 'Unknown Agency'}</div>
              <div className="text-xs text-gray-500 space-y-1">
                {facility.facility_type && <div>Type: {facility.facility_type}</div>}
                {facility.location && <div>Location: {facility.location}</div>}
              </div>
            </Link>
          ))}
        </div>

        {filteredFacilities.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No facilities found.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FacilitiesList;
