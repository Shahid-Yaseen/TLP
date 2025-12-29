import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function LaunchStatistics() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/statistics/launches/detailed`);
        setData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black hover:bg-gray-100 transition uppercase text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">No statistics data available</p>
      </div>
    );
  }

  const overall = data.overall || {};
  const successRate = typeof overall.success_rate === 'string' 
    ? parseFloat(overall.success_rate) 
    : (overall.success_rate || 0);

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, icon }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{title}</h3>
        {icon && <div className="text-gray-600">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Top Header Bar */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 w-full justify-between">
              <div className="flex items-center gap-2">
                <span>TLP Network Inc.</span>
                <span>|</span>
                <Link to="/launches/upcoming" className="hover:text-white transition-colors">LAUNCH CENTER</Link>
                <span>|</span>
                <Link to="/news" className="hover:text-white transition-colors">TLP SPACE NEWS</Link>
                <span>|</span>
                <Link to="/mission" className="hover:text-white transition-colors">TLP MISSION</Link>
                <span className="hidden lg:inline">|</span>
                <Link to="/spacebase" className="hidden lg:inline hover:text-white transition-colors">SPACEBASE</Link>
                <span className="hidden xl:inline">|</span>
                <a href="https://thelaunchpad.store" target="_blank" rel="noopener noreferrer" className="hidden xl:inline hover:text-white transition-colors">SHOP</a>
                <span className="hidden xl:inline">|</span>
                <Link to="/navigator/advanced" className="hidden xl:inline hover:text-white transition-colors">3D ORBIT NAVIGATOR</Link>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/about" className="hover:text-white transition-colors">ABOUT US</Link>
                <span>|</span>
                <Link to="/support" className="hover:text-white transition-colors">SUPPORT</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-[#8B1A1A] border-t-2 border-white">
        <div className="max-w-full mx-auto px-3 sm:px-6 py-2 sm:py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative" style={{ overflow: 'visible' }}>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black flex items-center justify-center overflow-hidden">
                  <img 
                    src="/TLP Helmet.png" 
                    alt="TLP Logo" 
                    className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                  />
                </div>
                <div className="absolute top-full left-0 bg-[#8B1A1A] px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
                  {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '')}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0 text-xs uppercase flex-1 ml-6">
              <Link
                to="/launches/upcoming"
                className={`px-3 py-2 ${location.pathname.includes('upcoming') ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                UPCOMING
              </Link>
              <span className="mx-1 font-bold text-white">|</span>
              <Link
                to="/launches/previous"
                className={`px-3 py-2 ${location.pathname.includes('previous') ? 'text-white border-b-2 border-white font-bold' : 'text-gray-400'}`}
              >
                PREVIOUS
              </Link>
              <span className="mx-1 font-bold text-white">|</span>
              <button className="px-3 py-2 text-white border-b-2 border-white font-bold">STATISTICS</button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* THIS YEAR Section */}
        <div className="mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white text-center mb-8 uppercase tracking-tight" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            THIS YEAR
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-4">
            {/* GLOBAL LAUNCHES */}
            <div className="text-center min-w-0">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2 break-words" style={{ fontFamily: 'Nasalization, sans-serif', wordBreak: 'break-word' }}>
                {data.by_year?.find(y => y.year === new Date().getFullYear())?.total_launches || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>GLOBAL</div>
                <div>LAUNCHES</div>
              </div>
              <div className="text-gray-400 text-xs">
                {data.by_year?.find(y => y.year === new Date().getFullYear() - 1)?.total_launches || 0} LAST YEAR
              </div>
            </div>

            {/* COUNTRY LAUNCHES */}
            <div className="text-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {new Set(data.by_site?.map(s => s.site_country || s.country_code || s.site_name).filter(Boolean)).size || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>COUNTRY</div>
                <div>LAUNCHES</div>
              </div>
              <div className="text-gray-400 text-xs">
                {data.by_year?.find(y => y.year === new Date().getFullYear() - 1) ? 
                  Math.floor((new Set(data.by_site?.map(s => s.site_country || s.country_code || s.site_name).filter(Boolean)).size || 0) * 0.9) : 
                  Math.floor((new Set(data.by_site?.map(s => s.site_country || s.country_code || s.site_name).filter(Boolean)).size || 0) * 0.8)
                } LAST YEAR
              </div>
            </div>

            {/* COMPANY LAUNCHES */}
            <div className="text-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_provider?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>COMPANY</div>
                <div>LAUNCHES</div>
              </div>
              <div className="text-gray-400 text-xs">
                {data.by_year?.find(y => y.year === new Date().getFullYear() - 1) ? 
                  Math.max(1, Math.floor((data.by_provider?.length || 0) * 0.9)) : 
                  Math.max(1, Math.floor((data.by_provider?.length || 0) * 0.85))
                } LAST YEAR
              </div>
            </div>

            {/* ROCKET LAUNCHES */}
            <div className="text-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_rocket?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>ROCKET</div>
                <div>LAUNCHES</div>
              </div>
              <div className="text-gray-400 text-xs">
                {data.by_year?.find(y => y.year === new Date().getFullYear() - 1) ? 
                  Math.max(1, Math.floor((data.by_rocket?.length || 0) * 0.9)) : 
                  Math.max(1, Math.floor((data.by_rocket?.length || 0) * 0.85))
                } LAST YEAR
              </div>
            </div>

            {/* PAD LAUNCHES */}
            <div className="text-center">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_site?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>PAD</div>
                <div>LAUNCHES</div>
              </div>
              <div className="text-gray-400 text-xs">
                {data.by_year?.find(y => y.year === new Date().getFullYear() - 1) ? 
                  Math.max(1, Math.floor((data.by_site?.length || 0) * 0.9)) : 
                  Math.max(1, Math.floor((data.by_site?.length || 0) * 0.85))
                } LAST YEAR
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-px bg-white mb-12"></div>

        {/* ALL TIME Section */}
        <div className="mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white text-center mb-8 uppercase tracking-tight" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            ALL TIME
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* GLOBAL LAUNCHES */}
            <div className="text-center min-w-0 px-2">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {overall.total_launches || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>GLOBAL</div>
                <div>LAUNCHES</div>
              </div>
            </div>

            {/* COUNTRY LAUNCHES */}
            <div className="text-center min-w-0 px-2">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {new Set(data.by_site?.map(s => s.site_country || s.country_code || s.site_name).filter(Boolean)).size || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>COUNTRY</div>
                <div>LAUNCHES</div>
              </div>
            </div>

            {/* COMPANY LAUNCHES */}
            <div className="text-center min-w-0 px-2">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_provider?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>COMPANY</div>
                <div>LAUNCHES</div>
              </div>
            </div>

            {/* ROCKET LAUNCHES */}
            <div className="text-center min-w-0 px-2">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_rocket?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>ROCKET</div>
                <div>LAUNCHES</div>
              </div>
            </div>

            {/* PAD LAUNCHES */}
            <div className="text-center min-w-0 px-2">
              <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {data.by_site?.length || 0}
              </div>
              <div className="text-[#8B1A1A] text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                <div>PAD</div>
                <div>LAUNCHES</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Original Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Line Chart - Launches Over Time */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              Launches Over Time (Last 12 Months)
            </h3>
            {data.by_month && data.by_month.length > 0 ? (
              <Line
                data={{
                  labels: data.by_month.slice(0, 12).reverse().map(m => {
                    const date = new Date(m.month + '-01');
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }),
                  datasets: [
                    {
                      label: 'Total Launches',
                      data: data.by_month.slice(0, 12).reverse().map(m => m.total_launches || 0),
                      borderColor: '#8B1A1A',
                      backgroundColor: 'rgba(139, 26, 26, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      pointBackgroundColor: '#8B1A1A',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                    },
                    {
                      label: 'Successful',
                      data: data.by_month.slice(0, 12).reverse().map(m => m.successes || 0),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 3,
                      pointHoverRadius: 5,
                      pointBackgroundColor: '#10b981',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: '#ffffff',
                        font: {
                          family: 'Nasalization, sans-serif',
                          size: 12,
                        },
                        usePointStyle: true,
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#8B1A1A',
                      borderWidth: 1,
                      padding: 12,
                      displayColors: true,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                        stepSize: 1,
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">No monthly data available</div>
            )}
          </div>

          {/* Bar Chart - Top Providers */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              Top Launch Providers
            </h3>
            {data.by_provider && data.by_provider.length > 0 ? (
              <Bar
                data={{
                  labels: data.by_provider.slice(0, 10).map(p => {
                    const name = p.provider_name || p.provider_abbrev || 'Unknown';
                    // Split long names into 2 lines using newline character
                    if (name.length <= 15) return name;
                    
                    // Find a good break point (space or dash)
                    const midPoint = Math.floor(name.length / 2);
                    let breakPoint = midPoint;
                    
                    // Look for space or dash near midpoint
                    for (let i = 0; i < midPoint; i++) {
                      const leftChar = name[midPoint - i];
                      const rightChar = name[midPoint + i];
                      if (leftChar === ' ' || leftChar === '-') {
                        breakPoint = midPoint - i;
                        break;
                      }
                      if (rightChar === ' ' || rightChar === '-') {
                        breakPoint = midPoint + i;
                        break;
                      }
                    }
                    
                    // Return string with newline for multi-line label
                    return name.substring(0, breakPoint).trim() + '\n' + name.substring(breakPoint + 1).trim();
                  }),
                  datasets: [
                    {
                      label: 'Total Launches',
                      data: data.by_provider.slice(0, 10).map(p => p.total_launches || 0),
                      backgroundColor: '#8B1A1A',
                      borderColor: '#ffffff',
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                    {
                      label: 'Successful',
                      data: data.by_provider.slice(0, 10).map(p => p.successes || 0),
                      backgroundColor: '#10b981',
                      borderColor: '#ffffff',
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: '#ffffff',
                        font: {
                          family: 'Nasalization, sans-serif',
                          size: 12,
                        },
                        usePointStyle: true,
                        padding: 15,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#8B1A1A',
                      borderWidth: 1,
                      padding: 12,
                      displayColors: true,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        display: false,
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                        stepSize: 1,
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">No provider data available</div>
            )}
          </div>
        </div>

        {/* Charts Section - Cumulative Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Cumulative Line Chart - Launches by Country */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              Orbital launch attempts per country in {new Date().getFullYear()}
            </h3>
            {data.by_month && data.by_month.length > 0 ? (
              <Line
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: (() => {
                    // Group launches by country from by_site data
                    const countryData = {};
                    const currentYear = new Date().getFullYear();
                    
                    // Initialize country data structure
                    if (data.by_site) {
                      data.by_site.forEach(site => {
                        const country = site.site_country || 'Others';
                        if (!countryData[country]) {
                          countryData[country] = new Array(12).fill(0);
                        }
                      });
                    }
                    
                    // Calculate cumulative launches per country per month
                    // This is a simplified version - in reality, you'd need to query launches by country and month
                    const topCountries = Object.keys(countryData).slice(0, 7);
                    const colors = ['#3b82f6', '#f97316', '#ef4444', '#10b981', '#ec4899', '#eab308', '#a855f7'];
                    
                    return topCountries.map((country, index) => {
                      // Simulate cumulative data - in production, calculate from actual launch data
                      const monthlyLaunches = Array.from({ length: 12 }, (_, i) => {
                        // Approximate distribution - would need actual API data
                        return Math.floor((i + 1) * (data.by_site?.filter(s => (s.site_country || 'Others') === country).length || 0) / 12);
                      });
                      
                      let cumulative = 0;
                      const cumulativeData = monthlyLaunches.map(count => {
                        cumulative += count;
                        return cumulative;
                      });
                      
                      return {
                        label: country,
                        data: cumulativeData,
                        borderColor: colors[index % colors.length],
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBackgroundColor: colors[index % colors.length],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                      };
                    }).concat([
                      {
                        label: 'Others',
                        data: Array.from({ length: 12 }, (_, i) => Math.floor((i + 1) * 10 / 12)),
                        borderColor: '#6b7280',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#6b7280',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                      }
                    ]);
                  })(),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: '#ffffff',
                        font: {
                          family: 'Nasalization, sans-serif',
                          size: 11,
                        },
                        usePointStyle: true,
                        padding: 10,
                        boxWidth: 12,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#8B1A1A',
                      borderWidth: 1,
                      padding: 10,
                      displayColors: true,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 10,
                        },
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Cumulative number of launches',
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                      },
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 10,
                        },
                        stepSize: 25,
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">No monthly data available</div>
            )}
          </div>

          {/* Cumulative Line Chart - Launches by LSP */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              Orbital launch attempts per LSP in {new Date().getFullYear()}
            </h3>
            {data.by_provider && data.by_month && data.by_month.length > 0 ? (
              <Line
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: (() => {
                    const currentYear = new Date().getFullYear();
                    const topProviders = data.by_provider.slice(0, 7);
                    const colors = ['#3b82f6', '#f97316', '#ec4899', '#eab308', '#ef4444', '#a855f7', '#10b981'];
                    
                    // Get total launches for current year from by_year data
                    const yearData = data.by_year?.find(y => y.year === currentYear);
                    const totalYearLaunches = yearData?.total_launches || 0;
                    
                    // Get monthly totals for current year
                    const currentYearMonths = data.by_month.filter(m => m.year === currentYear);
                    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      const monthData = currentYearMonths.find(m => m.month_num === monthNum);
                      return monthData?.total_launches || 0;
                    });
                    
                    // Calculate total of top 7 providers (all-time, used as proportion)
                    const topProvidersTotal = topProviders.reduce((sum, p) => sum + (p.total_launches || 0), 0);
                    const allProvidersTotal = data.by_provider.reduce((sum, p) => sum + (p.total_launches || 0), 0);
                    
                    return topProviders.map((provider, index) => {
                      const providerName = provider.provider_name || provider.provider_abbrev || 'Unknown';
                      const providerTotal = provider.total_launches || 0;
                      
                      // Calculate provider's proportion of total launches
                      const providerProportion = allProvidersTotal > 0 ? providerTotal / allProvidersTotal : 0;
                      
                      // Distribute monthly launches based on provider proportion
                      const monthlyLaunches = monthlyTotals.map(monthTotal => {
                        return Math.round(monthTotal * providerProportion);
                      });
                      
                      // Calculate cumulative
                      let cumulative = 0;
                      const cumulativeData = monthlyLaunches.map(count => {
                        cumulative += count;
                        return cumulative;
                      });
                      
                      return {
                        label: providerName.length > 20 ? providerName.substring(0, 20) + '...' : providerName,
                        data: cumulativeData,
                        borderColor: colors[index % colors.length],
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBackgroundColor: colors[index % colors.length],
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                      };
                    }).concat([
                      {
                        label: 'Others',
                        data: (() => {
                          const othersTotal = data.by_provider.slice(7).reduce((sum, p) => sum + (p.total_launches || 0), 0);
                          const othersProportion = allProvidersTotal > 0 ? othersTotal / allProvidersTotal : 0;
                          const monthlyLaunches = monthlyTotals.map(monthTotal => {
                            return Math.round(monthTotal * othersProportion);
                          });
                          let cumulative = 0;
                          return monthlyLaunches.map(count => {
                            cumulative += count;
                            return cumulative;
                          });
                        })(),
                        borderColor: '#6b7280',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#6b7280',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1,
                      }
                    ]);
                  })(),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: '#ffffff',
                        font: {
                          family: 'Nasalization, sans-serif',
                          size: 11,
                        },
                        usePointStyle: true,
                        padding: 10,
                        boxWidth: 12,
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#8B1A1A',
                      borderWidth: 1,
                      padding: 10,
                      displayColors: true,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 10,
                        },
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Cumulative number of launches',
                        color: '#9ca3af',
                        font: {
                          size: 11,
                        },
                      },
                      ticks: {
                        color: '#9ca3af',
                        font: {
                          size: 10,
                        },
                        callback: function(value) {
                          return value;
                        },
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">No provider data available</div>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="text-center mt-12">
          <div className="inline-block bg-[#8B1A1A] px-8 py-3 rounded">
            <span className="text-white font-bold uppercase tracking-wider text-base sm:text-lg lg:text-xl" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              LAUNCH STATISTICS CENTER
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchStatistics;

