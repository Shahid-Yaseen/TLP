import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

import API_URL from '../../config/api';

const RocketsList = () => {
  const [rockets, setRockets] = useState([]);
  const [filteredRockets, setFilteredRockets] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRockets();
    fetchProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedProvider, searchTerm, rockets]);

  const fetchRockets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/rockets`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setRockets(data);
      setFilteredRockets(data);
    } catch (error) {
      console.error('Error fetching rockets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/providers`);
      setProviders(response.data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(rockets)) {
      setFilteredRockets([]);
      return;
    }
    let filtered = [...rockets];

    if (selectedProvider !== 'ALL') {
      filtered = filtered.filter(rocket => rocket.provider_id === parseInt(selectedProvider));
    }

    if (searchTerm) {
      filtered = filtered.filter(rocket =>
        rocket.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRockets(filtered);
  };

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">SPACEBASE</div>
      <div className="flex items-center gap-4 text-white">
        <span className="bg-white text-black px-3 py-1 font-semibold">ROCKETS</span>
        <span>|</span>
        <Link to="/spacebase/engines" className="hover:text-gray-300">ENGINES</Link>
        <span>|</span>
        <Link to="/spacebase/spacecraft" className="hover:text-gray-300">SPACECRAFT</Link>
        <span>|</span>
        <Link to="/spacebase/facilities" className="hover:text-gray-300">FACILITIES</Link>
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
          Loading rockets...
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
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Providers</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search rockets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">ROCKET STATS</div>
          <div className="text-gray-400">Total Rockets: {filteredRockets.length}</div>
        </div>

        {/* Rockets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRockets.map((rocket) => (
            <Link
              key={rocket.id}
              to={`/spacebase/rockets/${rocket.id}`}
              className="bg-gray-900 hover:bg-gray-800 transition-colors p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-2">{rocket.name}</h3>
              <div className="text-sm text-gray-400 mb-4">{rocket.provider_name || 'Unknown Provider'}</div>
              {rocket.spec && (
                <div className="text-xs text-gray-500 space-y-1">
                  {rocket.spec.height_meters && <div>Height: {rocket.spec.height_meters}m</div>}
                  {rocket.spec.stages && <div>Stages: {rocket.spec.stages}</div>}
                </div>
              )}
            </Link>
          ))}
        </div>

        {filteredRockets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No rockets found.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RocketsList;
