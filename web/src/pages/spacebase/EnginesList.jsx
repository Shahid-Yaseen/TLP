import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

import API_URL from '../../config/api';

const EnginesList = () => {
  const [engines, setEngines] = useState([]);
  const [filteredEngines, setFilteredEngines] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngines();
    fetchAgencies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedAgency, selectedType, searchTerm, engines]);

  const fetchEngines = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/engines`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setEngines(data);
      setFilteredEngines(data);
    } catch (error) {
      console.error('Error fetching engines:', error);
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
    if (!Array.isArray(engines)) {
      setFilteredEngines([]);
      return;
    }
    let filtered = [...engines];

    if (selectedAgency !== 'ALL') {
      filtered = filtered.filter(engine => engine.manufacturer_id === parseInt(selectedAgency));
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(engine => engine.engine_type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(engine =>
        engine.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEngines(filtered);
  };

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">SPACEBASE</div>
      <div className="flex items-center gap-4 text-white">
        <Link to="/spacebase/rockets" className="hover:text-gray-300">ROCKETS</Link>
        <span>|</span>
        <span className="bg-white text-black px-3 py-1 font-semibold">ENGINES</span>
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
          Loading engines...
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
              <option value="ALL">All Manufacturers</option>
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
              <option value="liquid">Liquid</option>
              <option value="solid">Solid</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input
              type="text"
              placeholder="Search engines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">ENGINE STATS</div>
          <div className="text-gray-400">Total Engines: {filteredEngines.length}</div>
        </div>

        {/* Engines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEngines.map((engine) => (
            <Link
              key={engine.id}
              to={`/spacebase/engines/${engine.id}`}
              className="bg-gray-900 hover:bg-gray-800 transition-colors p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-2">{engine.name}</h3>
              <div className="text-sm text-gray-400 mb-4">{engine.manufacturer_name || 'Unknown Manufacturer'}</div>
              <div className="text-xs text-gray-500 space-y-1">
                {engine.engine_type && <div>Type: {engine.engine_type}</div>}
                {engine.thrust_vacuum_kn && <div>Thrust: {engine.thrust_vacuum_kn} kN</div>}
              </div>
            </Link>
          ))}
        </div>

        {filteredEngines.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No engines found.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnginesList;
