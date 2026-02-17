import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const SpacecraftList = () => {
  const { setSectionNav } = useOutletContext();
  const [spacecraft, setSpacecraft] = useState([]);
  const [filteredSpacecraft, setFilteredSpacecraft] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpacecraft();
    fetchAgencies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedAgency, selectedType, selectedStatus, searchTerm, spacecraft]);

  const fetchSpacecraft = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/spacebase/spacecraft`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setSpacecraft(data);
      setFilteredSpacecraft(data);
    } catch (error) {
      console.error('Error fetching spacecraft:', error);
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
    if (!Array.isArray(spacecraft)) {
      setFilteredSpacecraft([]);
      return;
    }
    let filtered = [...spacecraft];

    if (selectedAgency !== 'ALL') {
      filtered = filtered.filter(s => s.manufacturer_id === parseInt(selectedAgency));
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(s => s.spacecraft_type === selectedType);
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSpacecraft(filtered);
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

  useEffect(() => {
    setSectionNav(sectionNav);
    return () => setSectionNav(null);
  }, []);

  if (loading) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading spacecraft...
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
              <option value="capsule">Capsule</option>
              <option value="station">Station</option>
              <option value="lander">Lander</option>
              <option value="rover">Rover</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="retired">Retired</option>
              <option value="in-development">In Development</option>
            </select>
            <input
              type="text"
              placeholder="Search spacecraft..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">SPACECRAFT STATS</div>
          <div className="text-gray-400">Total Spacecraft: {filteredSpacecraft.length}</div>
        </div>

        {/* Spacecraft Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpacecraft.map((s) => (
            <Link
              key={s.id}
              to={`/spacebase/spacecraft/${s.id}`}
              className="bg-gray-900 hover:bg-gray-800 transition-colors p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-2">{s.name}</h3>
              <div className="text-sm text-gray-400 mb-4">{s.manufacturer_name || 'Unknown Manufacturer'}</div>
              <div className="text-xs text-gray-500 space-y-1">
                {s.spacecraft_type && <div>Type: {s.spacecraft_type}</div>}
                {s.status && <div>Status: {s.status}</div>}
                {s.capacity_crew && <div>Crew Capacity: {s.capacity_crew}</div>}
              </div>
            </Link>
          ))}
        </div>

        {filteredSpacecraft.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No spacecraft found.
          </div>
        )}
      </div>
    </>
  );
};

export default SpacecraftList;
