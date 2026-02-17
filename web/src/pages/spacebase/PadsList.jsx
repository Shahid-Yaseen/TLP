import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const PadsList = () => {
  const { setSectionNav } = useOutletContext();
  const [pads, setPads] = useState([]);
  const [filteredPads, setFilteredPads] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPads();
    fetchSites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedSite, searchTerm, pads]);

  const fetchPads = async () => {
    try {
      // TODO: Create dedicated pads API endpoint if needed
      // For now, pads are typically accessed through launch sites
      const response = await axios.get(`${API_URL}/api/launch-sites`);
      // Extract pads from sites or use placeholder
      setPads([]); // Will be populated when endpoint exists
      setFilteredPads([]);
    } catch (error) {
      console.error('Error fetching pads:', error);
      setPads([]);
      setFilteredPads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/launch-sites`);
      setSites(response.data || []);
    } catch (error) {
      console.error('Error fetching launch sites:', error);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(pads)) {
      setFilteredPads([]);
      return;
    }
    let filtered = [...pads];

    if (selectedSite !== 'ALL') {
      filtered = filtered.filter(pad => pad.site_id === parseInt(selectedSite));
    }

    if (searchTerm) {
      filtered = filtered.filter(pad =>
        pad.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPads(filtered);
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
        <Link to="/spacebase/facilities" className="hover:text-gray-300">FACILITIES</Link>
        <span>|</span>
        <span className="bg-white text-black px-3 py-1 font-semibold">PADS</span>
        <span>|</span>
        <Link to="/spacebase/agencies" className="hover:text-gray-300">AGENCIES</Link>
      </div>
    </div>
  );

  useEffect(() => {
    setSectionNav(sectionNav);
    return () => setSectionNav(null);
  }, []);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="bg-black border-b border-gray-800 py-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="ALL">All Launch Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search pads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">LAUNCH PAD STATS</div>
          <div className="text-gray-400">Total Pads: {filteredPads.length}</div>
        </div>

        {/* Note */}
        <div className="bg-gray-900 border border-gray-800 p-6 mb-8 text-center text-gray-400">
          <p>Launch pads listing will be available when the API endpoint is implemented.</p>
          <p className="text-sm mt-2">Pads are currently accessible through launch sites and individual launches.</p>
        </div>

        {filteredPads.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No launch pads found.
          </div>
        )}
      </div>
    </>
  );
};

export default PadsList;
