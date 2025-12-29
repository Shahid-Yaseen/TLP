import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';

const News = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [topStories, setTopStories] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [americaArticles, setAmericaArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('TODAY');
  const [currentTime, setCurrentTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('NEWS');
  const [interviewScrollPosition, setInterviewScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const interviewCarouselRef = useRef(null);
  const [stockTickers, setStockTickers] = useState([]);

  const categories = ['NEWS', 'LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];
  const trending = [
    { label: 'TRENDING', search: 'trending', route: null },
    { label: 'SPACEX', search: 'spacex', route: null },
    { label: 'ARTEMIS 2', search: 'artemis', route: null },
    { label: 'MARS SAMPLE RETURN', search: 'mars sample return', route: null },
    { label: 'DARPA LUNAR ORBITER', search: 'darpa lunar', route: null }
  ];
  const [selectedTrending, setSelectedTrending] = useState(null);
  
  // Fallback stock ticker data
  const defaultStockTickers = [
    { symbol: 'RKLB', name: 'RocketLab', price: 420069.00, change: 69.00, changePercent: 0.03, isPositive: true },
    { symbol: 'RKLB', name: 'RocketLab', price: 420069.00, change: 69.00, changePercent: 0.03, isPositive: true },
    { symbol: 'RKLB', name: 'RocketLab', price: 420069.00, change: 69.00, changePercent: 0.03, isPositive: true },
    { symbol: 'RKLB', name: 'RocketLab', price: 420069.00, change: -69.00, changePercent: -0.03, isPositive: false },
    { symbol: 'RKLB', name: 'RocketLab', price: 420069.00, change: -69.00, changePercent: -0.03, isPositive: false },
  ];

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const StockTickerCard = ({ stock }) => {
    const formattedPrice = currencyFormatter.format(stock.price);
    const isPositive = stock.change > 0;
    const formattedChange = `${isPositive ? '+' : '-'}${Math.abs(stock.change).toFixed(2)}`;
    const formattedPercent = `${isPositive ? '+' : '-'}${Math.abs(stock.changePercent).toFixed(2)}%`;

    return (
      <div className="flex-1">
        <div
          className="border border-black overflow-hidden h-full"
          style={{
            background: isPositive 
              ? 'linear-gradient(to right, #062817, #11442b)' 
              : 'linear-gradient(to right, #441111, #280606)'
          }}
        >
          {/* White top section with black text */}
          <div className="bg-white px-4 py-1 flex items-center justify-between border-b border-black/10">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {stock.symbol}
              </span>
              <span className="text-[11px] font-normal text-black">({stock.name})</span>
            </div>
            <span className="text-[11px] font-bold text-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              NASDAQ
            </span>
          </div>
          {/* Gradient bottom section with white text */}
          <div className="px-4 py-4 flex flex-col">
            <div
              className="text-white text-3xl font-medium mb-1 tracking-tight"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {formattedPrice}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[15px] ${isPositive ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                {isPositive ? '▲' : '▼'}
              </span>
              <span className={`text-[14px] font-medium ${isPositive ? 'text-[#4ade80]' : 'text-[#f87171]'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {formattedChange} ({formattedPercent})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Demo images for all news articles
  const getDemoImage = (index = 0) => {
    const images = [
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516841273335-c42b1e89f3e6?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517976377994-20541aec3835?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521185496955-15021babc2d4?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&h=800&fit=crop&q=80',
    ];
    return images[index % images.length];
  };

  // Dummy data for development/fallback
  const dummyFeaturedArticle = {
    id: 1,
    slug: 'live-coverage-china-shenzhou-20-crew-launch',
    title: 'LIVE COVERAGE! China Shenzhou 20 Crew Launch',
    excerpt: 'The Shenzhou 20 mission will lift off aboard a Long March 2F rocket from the Jiuquan Satellite Launch Center in northwest China at 5:17 a.m. EDT (0917 GMT; 5:17 p.m. Beijing time).',
    featured_image_url: getDemoImage(0),
    category: { name: 'China' },
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    is_featured: true
  };

  const dummyArticles = [
    {
      id: 2,
      slug: 'atmos-phoenix-1-reaches-orbit',
      title: 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test',
      excerpt: 'The innovative inflatable reentry vehicle successfully completed its orbital test, marking a significant milestone in reusable spacecraft technology.',
      featured_image_url: getDemoImage(1),
      category: { name: 'In Space' },
      published_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      slug: 'spacex-starship-successful-test-flight',
      title: 'SpaceX Starship Completes Successful Test Flight to Orbit',
      excerpt: 'Elon Musk\'s Starship achieves milestone with successful orbital test, bringing humanity one step closer to Mars colonization.',
      featured_image_url: getDemoImage(2),
      category: { name: 'Launch' },
      published_at: new Date(Date.now() - 172800000).toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      slug: 'nasa-artemis-2-mission-update',
      title: 'NASA Artemis 2 Mission: Astronauts Prepare for Lunar Return',
      excerpt: 'The Artemis 2 crew continues training for humanity\'s return to the Moon, with launch scheduled for next year.',
      featured_image_url: getDemoImage(3),
      category: { name: 'Launch' },
      published_at: new Date(Date.now() - 259200000).toISOString(),
      created_at: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 5,
      slug: 'mars-sample-return-mission-progress',
      title: 'Mars Sample Return Mission Makes Significant Progress',
      excerpt: 'NASA and ESA collaboration advances with successful sample collection on the Red Planet.',
      featured_image_url: getDemoImage(4),
      category: { name: 'Technology' },
      published_at: new Date(Date.now() - 345600000).toISOString(),
      created_at: new Date(Date.now() - 345600000).toISOString()
    },
    {
      id: 6,
      slug: 'darpa-lunar-orbiter-water-prospecting',
      title: 'DARPA Seeks Proposals for Lunar Orbiter to Prospect Water Ice',
      excerpt: 'Defense Advanced Research Projects Agency announces new initiative to map and prospect lunar water resources.',
      featured_image_url: getDemoImage(5),
      category: { name: 'Military' },
      published_at: new Date(Date.now() - 432000000).toISOString(),
      created_at: new Date(Date.now() - 432000000).toISOString()
    },
    {
      id: 7,
      slug: 'rocketlab-electron-launch-success',
      title: 'RocketLab Electron Successfully Deploys 30 Satellites',
      excerpt: 'RocketLab achieves another successful launch, deploying a constellation of small satellites into low Earth orbit.',
      featured_image_url: getDemoImage(6),
      category: { name: 'Launch' },
      published_at: new Date(Date.now() - 518400000).toISOString(),
      created_at: new Date(Date.now() - 518400000).toISOString()
    },
    {
      id: 8,
      slug: 'james-webb-telescope-new-discovery',
      title: 'James Webb Telescope Discovers Ancient Galaxy Formation',
      excerpt: 'The most powerful space telescope reveals new insights into the early universe and galaxy formation processes.',
      featured_image_url: getDemoImage(7),
      category: { name: 'Technology' },
      published_at: new Date(Date.now() - 604800000).toISOString(),
      created_at: new Date(Date.now() - 604800000).toISOString()
    },
    {
      id: 9,
      slug: 'space-tourism-blue-origin-flight',
      title: 'Blue Origin Completes 25th Suborbital Tourism Flight',
      excerpt: 'Jeff Bezos\' space company continues its commercial spaceflight operations with another successful crewed mission.',
      featured_image_url: getDemoImage(8),
      category: { name: 'Launch' },
      published_at: new Date(Date.now() - 691200000).toISOString(),
      created_at: new Date(Date.now() - 691200000).toISOString()
    },
    {
      id: 10,
      slug: 'international-space-station-expansion',
      title: 'International Space Station Receives New Science Module',
      excerpt: 'The ISS expands its research capabilities with the addition of a new European-built science laboratory module.',
      featured_image_url: getDemoImage(9),
      category: { name: 'In Space' },
      published_at: new Date(Date.now() - 777600000).toISOString(),
      created_at: new Date(Date.now() - 777600000).toISOString()
    },
    {
      id: 11,
      slug: 'spacex-falcon-heavy-triple-landing',
      title: 'SpaceX Falcon Heavy Achieves Triple Booster Landing',
      excerpt: 'SpaceX successfully lands all three Falcon Heavy boosters, demonstrating advanced reusable rocket technology.',
      featured_image_url: getDemoImage(0),
      category: { name: 'Launch' },
      published_at: new Date(Date.now() - 864000000).toISOString(),
      created_at: new Date(Date.now() - 864000000).toISOString()
    },
    {
      id: 12,
      slug: 'nasa-perseverance-rover-findings',
      title: 'NASA Perseverance Rover Finds Evidence of Ancient Water',
      excerpt: 'The Mars rover discovers compelling evidence of past water activity in Jezero Crater, supporting theories of ancient Martian life.',
      featured_image_url: getDemoImage(1),
      category: { name: 'Technology' },
      published_at: new Date(Date.now() - 950400000).toISOString(),
      created_at: new Date(Date.now() - 950400000).toISOString()
    }
  ];

  const dummyInterviews = [
    {
      id: 13,
      slug: 'interview-jared-isaacman-nasa',
      title: 'Exclusive Interview: Jared Isaacman on Private Spaceflight',
      excerpt: 'The billionaire astronaut discusses his vision for commercial space exploration and upcoming missions.',
      featured_image_url: getDemoImage(2),
      category: { name: 'News' },
      published_at: new Date(Date.now() - 1036800000).toISOString(),
      created_at: new Date(Date.now() - 1036800000).toISOString()
    },
    {
      id: 14,
      slug: 'interview-chris-hadfield-astronaut',
      title: 'Chris Hadfield: Life After Space',
      excerpt: 'The Canadian astronaut shares his experiences on the ISS and his continued advocacy for space exploration.',
      featured_image_url: getDemoImage(3),
      category: { name: 'News' },
      published_at: new Date(Date.now() - 1123200000).toISOString(),
      created_at: new Date(Date.now() - 1123200000).toISOString()
    },
    {
      id: 15,
      slug: 'interview-elon-musk-spacex',
      title: 'Elon Musk on the Future of SpaceX',
      excerpt: 'The SpaceX CEO discusses Starship development, Mars colonization timeline, and the future of human spaceflight.',
      featured_image_url: getDemoImage(4),
      category: { name: 'News' },
      published_at: new Date(Date.now() - 1209600000).toISOString(),
      created_at: new Date(Date.now() - 1209600000).toISOString()
    }
  ];

  const dummyAmericaArticles = [
    {
      id: 16,
      slug: 'spacex-launches-starlink-constellation',
      title: 'SpaceX Launches 60 More Starlink Satellites',
      excerpt: 'The company continues expanding its global internet constellation with another successful Falcon 9 launch.',
      featured_image_url: getDemoImage(5),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1296000000).toISOString(),
      created_at: new Date(Date.now() - 1296000000).toISOString()
    },
    {
      id: 17,
      slug: 'nasa-commercial-crew-program',
      title: 'NASA Commercial Crew Program Reaches Milestone',
      excerpt: 'The agency celebrates successful partnership with private companies for crew transportation to the ISS.',
      featured_image_url: getDemoImage(6),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1382400000).toISOString(),
      created_at: new Date(Date.now() - 1382400000).toISOString()
    },
    {
      id: 18,
      slug: 'blue-origin-new-glenn-development',
      title: 'Blue Origin New Glenn Rocket Enters Final Testing Phase',
      excerpt: 'The heavy-lift rocket moves closer to its first launch as testing progresses at the company\'s facilities.',
      featured_image_url: getDemoImage(7),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1468800000).toISOString(),
      created_at: new Date(Date.now() - 1468800000).toISOString()
    },
    {
      id: 19,
      slug: 'nasa-viper-lunar-rover',
      title: 'NASA VIPER Rover Prepares for Lunar South Pole Mission',
      excerpt: 'The Volatiles Investigating Polar Exploration Rover will search for water ice on the Moon\'s south pole.',
      featured_image_url: getDemoImage(8),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1555200000).toISOString(),
      created_at: new Date(Date.now() - 1555200000).toISOString()
    },
    {
      id: 20,
      slug: 'space-force-satellite-launch',
      title: 'US Space Force Launches Advanced Communication Satellite',
      excerpt: 'The military branch successfully deploys a new satellite to enhance global communication capabilities.',
      featured_image_url: getDemoImage(9),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1641600000).toISOString(),
      created_at: new Date(Date.now() - 1641600000).toISOString()
    },
    {
      id: 21,
      slug: 'nasa-gateway-lunar-station',
      title: 'NASA Gateway Lunar Station Construction Begins',
      excerpt: 'The first components of the lunar space station are being prepared for launch as part of the Artemis program.',
      featured_image_url: getDemoImage(0),
      category: { name: 'America' },
      published_at: new Date(Date.now() - 1728000000).toISOString(),
      created_at: new Date(Date.now() - 1728000000).toISOString()
    }
  ];

  const fetchStockTickers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stock-tickers`, {
        params: { active_only: 'true' }
      });
      
      // Handle both array and object responses
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      // Transform API data to match component format
      const tickers = data.map(ticker => ({
        symbol: ticker.symbol,
        name: ticker.name,
        price: parseFloat(ticker.price) || 0,
        change: parseFloat(ticker.change) || 0,
        changePercent: parseFloat(ticker.change_percent) || 0,
        isPositive: parseFloat(ticker.change) >= 0
      }));
      
      if (tickers.length > 0) {
        setStockTickers(tickers);
      } else {
        // Use default if no tickers found
        setStockTickers(defaultStockTickers);
      }
    } catch (error) {
      console.error('Error fetching stock tickers:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Use default on error
      setStockTickers(defaultStockTickers);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchStockTickers();
  }, [timeFilter, selectedCategory, selectedTrending]);

  // Initialize scroll state for interviews carousel
  useEffect(() => {
    if (interviewCarouselRef.current) {
      const checkScroll = () => {
        const el = interviewCarouselRef.current;
        if (el) {
          setCanScrollLeft(el.scrollLeft > 0);
          setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
        }
      };
      checkScroll();
      // Recheck on window resize
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [interviews]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedTrending(null); // Clear trending selection when category changes
    // Category filtering is handled in fetchArticles via selectedCategory
  };

  const handleTrendingClick = (trendingItem) => {
    setSelectedTrending(trendingItem.label);
    // Scroll to top stories section when trending is clicked
    setTimeout(() => {
      const topStoriesSection = document.getElementById('top-stories-section');
      if (topStoriesSection) {
        topStoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      let dateFrom = null;
      
      if (timeFilter === 'TODAY') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (timeFilter === 'THIS WEEK') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFrom = weekAgo.toISOString();
      } else if (timeFilter === 'THIS MONTH') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFrom = monthAgo.toISOString();
      }

      const params = {
        status: 'published',
        limit: 30,
        offset: 0,
      };

      if (dateFrom) {
        params.date_from = dateFrom;
      }

      // Add category filter if not 'NEWS' (which shows all)
      if (selectedCategory && selectedCategory !== 'NEWS') {
        // Convert category name to slug for API
        // Map category names to their API slugs
        const categorySlugMap = {
          'LAUNCH': 'launch',
          'IN SPACE': 'in-space',
          'TECHNOLOGY': 'technology',
          'MILITARY': 'military',
          'FINANCE': 'finance'
        };
        const categorySlug = categorySlugMap[selectedCategory] || selectedCategory.toLowerCase().replace(/\s+/g, '-');
        params.category = categorySlug;
      }

      // Add search filter if trending is selected
      if (selectedTrending) {
        const trendingItem = trending.find(t => t.label === selectedTrending);
        if (trendingItem && trendingItem.search) {
          params.search = trendingItem.search;
        }
      }

      const [articlesRes, featuredRes, interviewsRes, trendingRes] = await Promise.all([
        axios.get(`${API_URL}/api/news`, { params }),
        axios.get(`${API_URL}/api/news/featured`, { params: { limit: 1 } }),
        axios.get(`${API_URL}/api/news`, { params: { status: 'published', limit: 12, is_interview: 'true' } }),
        axios.get(`${API_URL}/api/news/trending`, { params: { limit: 6 } }),
      ]);

      // Handle API response structure: { data: [...], pagination: {...} } or direct array
      const articlesData = Array.isArray(articlesRes.data) 
        ? articlesRes.data 
        : articlesRes.data?.data || [];
      
      // Featured endpoint returns array directly
      const featuredData = Array.isArray(featuredRes.data) 
        ? featuredRes.data 
        : featuredRes.data?.data || [];
      
      // Interviews - handle both array and wrapped response
      const interviewsData = Array.isArray(interviewsRes.data)
        ? interviewsRes.data
        : interviewsRes.data?.data || [];
      
      // Trending articles for "America" section (or use top stories)
      const trendingData = Array.isArray(trendingRes.data)
        ? trendingRes.data
        : trendingRes.data?.data || [];

      // Use API data if available, otherwise use dummy data
      // Add demo images to all articles
      const addDemoImages = (articleList, startIndex = 0) => {
        return articleList.map((article, idx) => ({
          ...article,
          featured_image_url: article.featured_image_url || getDemoImage((startIndex + idx) % 10)
        }));
      };

      if (articlesData.length > 0) {
        const articlesWithImages = addDemoImages(articlesData, 0);
        setArticles(articlesWithImages);
        setTopStories(articlesWithImages.slice(0, 5));
      } else {
        setArticles(dummyArticles);
        setTopStories(dummyArticles.slice(0, 5));
      }

      if (featuredData.length > 0) {
        setFeaturedArticle({
          ...featuredData[0],
          featured_image_url: featuredData[0].featured_image_url || getDemoImage(0)
        });
      } else if (articlesData.length > 0) {
        setFeaturedArticle({
          ...articlesData[0],
          featured_image_url: articlesData[0].featured_image_url || getDemoImage(0)
        });
      } else {
        setFeaturedArticle(dummyFeaturedArticle);
      }

      if (interviewsData.length > 0) {
        setInterviews(addDemoImages(interviewsData, 2));
      } else {
        setInterviews(dummyInterviews);
      }

      // Use trending articles for "America" section, or fallback to top stories
      if (trendingData.length > 0) {
        setAmericaArticles(addDemoImages(trendingData.slice(0, 6), 5));
      } else if (articlesData.length > 0) {
        setAmericaArticles(addDemoImages(articlesData.slice(0, 6), 5));
      } else {
        setAmericaArticles(dummyAmericaArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Use dummy data on error
      console.error('Error fetching articles:', error);
      setArticles(dummyArticles);
      setFeaturedArticle(dummyFeaturedArticle);
      setTopStories(dummyArticles.slice(0, 5));
      setInterviews(dummyInterviews);
      setAmericaArticles(dummyAmericaArticles);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '4d';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '');
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const sectionNav = (
    <div className="bg-orange-500 border-t-2 border-white">
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between py-0">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 flex-wrap">
          {/* Logo Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" style={{ overflow: 'visible', marginTop: '12px' }}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="/TLP Helmet.png" 
                  alt="TLP Logo" 
                  className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                />
              </div>
              <div className="absolute top-full left-0 bg-orange-500 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime}
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>NEWS</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-0 text-[10px] sm:text-xs uppercase flex-wrap">
            {categories.slice(1).map((cat, idx) => (
              <div key={cat} className="flex items-center">
                {idx > 0 && <span className="mx-0.5 sm:mx-1 font-bold text-white">|</span>}
                {cat === 'LAUNCH' ? (
                  <button
                    onClick={() => navigate('/launches/news')}
                    className="px-1 sm:px-2 py-1 text-white border-b-2 border-white font-bold"
                  >
                    {cat}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Navigate to category-specific page
                      const categorySlugMap = {
                        'IN SPACE': '/news/in-space',
                        'TECHNOLOGY': '/news/technology',
                        'MILITARY': '/news/military',
                        'FINANCE': '/news/finance'
                      };
                      const route = categorySlugMap[cat];
                      if (route) {
                        navigate(route);
                      } else {
                        handleCategoryChange(cat);
                      }
                    }}
                    className={`px-1 sm:px-2 py-1 text-white ${
                      selectedCategory === cat 
                        ? 'border-b-2 border-white font-bold' 
                        : 'font-normal'
                    }`}
                  >
                    {cat}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Trending Sub-Navigation */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-[2px] pb-[2px]">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {trending.map((topic, idx) => (
              <div key={idx} className="flex items-center shrink-0">
                {idx > 0 && <span className="text-black mx-2 sm:mx-3">|</span>}
                <button
                  onClick={() => handleTrendingClick(topic)}
                  className={`text-xs sm:text-sm font-medium text-black transition-colors whitespace-nowrap px-1 sm:px-2 py-1 hover:text-orange-500 ${
                    selectedTrending === topic.label 
                      ? 'font-bold text-orange-500 border-b-2 border-orange-500' 
                      : topic.label === 'SPACEX' && !selectedTrending
                      ? 'font-bold' 
                      : ''
                  }`}
                >
                  {topic.label}
                </button>
              </div>
            ))}
            {selectedTrending && (
              <>
                <span className="text-black mx-2 sm:mx-3">|</span>
                <button
                  onClick={() => {
                    setSelectedTrending(null);
                    fetchArticles();
                  }}
                  className="text-xs sm:text-sm font-medium text-gray-500 hover:text-black transition-colors whitespace-nowrap px-1 sm:px-2 py-1"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 pt-[2px] pb-[2px]">
        {/* Featured Article - China Shenzhou 20 */}
        {featuredArticle && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Main Featured Article */}
              <div className="lg:col-span-2">
                <Link to={`/news/${featuredArticle.slug || featuredArticle.id}`}>
                  <div className="relative h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0a1f3a, #000000)' }}>
                    <div className="absolute inset-0">
                      <img
                        src={featuredArticle.featured_image_url || getDemoImage(0)}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getDemoImage(0);
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-transparent to-black/70"></div>
                    <div className="absolute inset-0 flex flex-col justify-end items-center p-4 sm:p-6 md:p-8 z-10 text-center">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white uppercase leading-tight max-w-4xl" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                        {featuredArticle.title || 'LIVE COVERAGE! China Shenzhou 20 Crew Launch'}
                      </h1>
                      <p className="text-white text-sm sm:text-base mb-4 sm:mb-6 max-w-3xl leading-relaxed">
                        {featuredArticle.excerpt || 'The Shenzhou 20 mission will lift off aboard a Long March 2F rocket from the Jiuquan Satellite Launch Center in northwest China at 5:17 a.m. EDT (0917 GMT; 5:17 p.m. Beijing time).'}
                      </p>
                      <button className="bg-orange-500 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm hover:bg-orange-600 transition-colors">
                        {featuredArticle.category_name || featuredArticle.category?.name || 'NEWS'}
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* Side Articles */}
              <div className="hidden lg:block space-y-3">
                {[1, 2].map((idx) => (
                  <Link key={idx} to={`/news/${featuredArticle.slug || featuredArticle.id}`}>
                    <div className="relative h-[290px] overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0a1f3a, #000000)' }}>
                      <div className="absolute inset-0">
                        <img
                          src={featuredArticle.featured_image_url || getDemoImage(0)}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getDemoImage(0);
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 via-transparent to-black/70"></div>
                      <div className="absolute inset-0 flex flex-col justify-end items-center p-4 z-10 text-center">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight uppercase max-w-full" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                          {featuredArticle.title || 'LIVE COVERAGE! China Shenzhou 20 Crew Launch'}
                        </h3>
                        <p className="text-white text-xs mb-3 line-clamp-2 leading-relaxed max-w-full">
                          {featuredArticle.excerpt || 'The Shenzhou 20 mission will lift off aboard a Long March 2F rocket from the Jiuquan Satellite Launch Center in northwest China at 5:17 a.m. EDT (0917 GMT; 5:17 p.m. Beijing time).'}
                        </p>
                        <button className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-orange-600 transition-colors">
                          {featuredArticle.category_name || featuredArticle.category?.name || 'NEWS'}
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stock Ticker */}
        <div className="mb-8 sm:mb-10 md:mb-12 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 w-full">
            {(stockTickers.length > 0 ? stockTickers : defaultStockTickers).map((stock, idx) => (
              <StockTickerCard key={stock.symbol + '-' + idx} stock={stock} />
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Link
              to="/news/finance"
              className="text-white text-xs sm:text-sm font-bold uppercase hover:text-orange-400 transition-colors"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              SEE MORE
            </Link>
          </div>
        </div>

        {/* ATMOS PHOENIX 1 Section */}
        {articles.length > 0 && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
              {/* Large Article */}
              <div className="md:col-span-1 flex">
                <Link to={`/news/${articles[0]?.slug || articles[0]?.id}`} className="flex flex-col w-full">
                  <div className="bg-black flex flex-col h-full">
                    <div className="flex-1 w-full overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-[320px]">
                      <img
                        src={articles[0]?.featured_image_url || getDemoImage(1)}
                        alt={articles[0]?.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getDemoImage(1);
                        }}
                      />
                    </div>
                    <div className="p-4 sm:p-5 md:p-6 bg-black">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'sans-serif' }}>
                        {articles[0]?.title || 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test'}
                      </h2>
                      <div className="border-t border-white mb-3 sm:mb-4"></div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(articles[0]?.published_at || articles[0]?.created_at)}</span>
                        </div>
                        <span className="bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">{articles[0]?.category_name || articles[0]?.category?.name || 'In Space'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
              
              {/* 2x2 Grid */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {articles.slice(1, 5).map((article, idx) => (
                  <Link key={article.id || idx} to={`/news/${article.slug || article.id}`} className="flex flex-col h-full">
                    <div className="bg-black flex flex-col h-full">
                      <div className="h-40 sm:h-44 md:h-40 w-full overflow-hidden flex-shrink-0">
                        <img
                          src={article.featured_image_url || getDemoImage(idx + 2)}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getDemoImage(idx + 2);
                          }}
                        />
                      </div>
                      <div className="p-3 sm:p-4 bg-black flex-1 flex flex-col">
                        <h3 className="text-sm font-bold text-white mb-2 sm:mb-3 line-clamp-2" style={{ fontFamily: 'sans-serif' }}>
                          {article.title || 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test'}
                        </h3>
                        <div className="border-t border-white mb-2 sm:mb-3"></div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-auto flex-wrap">
                          <div className="flex items-center gap-2 text-white text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(article.published_at || article.created_at)}</span>
                          </div>
                          <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">{article.category_name || article.category?.name || 'In Space'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        {interviews.length > 0 && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-orange-500 uppercase" style={{ fontFamily: 'sans-serif' }}>RECENT INTERVIEWS</h2>
            <div className="relative">
              <div 
                ref={interviewCarouselRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
                onScroll={(e) => {
                  const target = e.target;
                  const scrollLeft = target.scrollLeft;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  
                  setInterviewScrollPosition(scrollLeft);
                  setCanScrollLeft(scrollLeft > 0);
                  setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
                }}
              >
                {interviews.slice(0, 12).map((interview, idx) => (
                  <Link
                    key={interview.id || idx}
                    to={`/news/${interview.slug || interview.id}`}
                    className="shrink-0 w-64 sm:w-72 md:w-80 bg-black hover:opacity-90 transition-opacity"
                  >
                    <div className="h-48 sm:h-56 md:h-64 w-full overflow-hidden">
                      <img
                        src={interview.featured_image_url || getDemoImage(idx + 2)}
                        alt={interview.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getDemoImage(idx + 2);
                        }}
                      />
                    </div>
                    <div className="p-3 sm:p-4 bg-black">
                      <div className="text-orange-500 font-bold text-base sm:text-lg mb-1 uppercase line-clamp-2" style={{ fontFamily: 'sans-serif' }}>
                        {interview.title || 'JARED ISAACMAN'}
                      </div>
                      <div className="text-white text-xs sm:text-sm uppercase line-clamp-2" style={{ fontFamily: 'sans-serif' }}>
                        {interview.excerpt || 'NASA ADMINISTRATOR'}
                      </div>
                    </div>
                  </Link>
                ))}
                {/* More button after 10-12 cards */}
                {interviews.length >= 10 && (
                  <div className="shrink-0 w-64 sm:w-72 md:w-80 flex items-center justify-center bg-black">
                    <Link
                      to="/news/interviews"
                      className="bg-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded font-bold uppercase hover:bg-orange-600 transition-colors text-sm sm:text-base"
                      style={{ fontFamily: 'sans-serif' }}
                    >
                      MORE
                    </Link>
                  </div>
                )}
              </div>
              {/* Navigation Arrows */}
              {canScrollLeft && (
                <button
                  onClick={() => {
                    if (interviewCarouselRef.current) {
                      const scrollAmount = window.innerWidth < 640 ? 256 : window.innerWidth < 768 ? 288 : 320;
                      interviewCarouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 bg-black/80 text-white p-2 hover:bg-black transition-colors z-10"
                  aria-label="Previous interviews"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => {
                    if (interviewCarouselRef.current) {
                      const scrollAmount = window.innerWidth < 640 ? 256 : window.innerWidth < 768 ? 288 : 320;
                      interviewCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  }}
                  className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 bg-black/80 text-white p-2 hover:bg-black transition-colors z-10"
                  aria-label="Next interviews"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Stories */}
        <div id="top-stories-section" className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6 border-b border-gray-700 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {selectedTrending ? `${selectedTrending} STORIES` : 'TOP STORIES'}
            </h2>
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              {['TODAY', 'THIS WEEK', 'THIS MONTH'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium transition-colors ${
                    timeFilter === filter
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {/* Large Article */}
            {topStories.length > 0 && (
              <div className="md:col-span-1 flex">
                <Link to={`/news/${topStories[0]?.slug || topStories[0]?.id}`} className="flex flex-col w-full">
                  <div className="bg-black flex flex-col h-full">
                    <div className="flex-1 w-full overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-[320px]">
                      <img
                        src={topStories[0]?.featured_image_url || getDemoImage(0)}
                        alt={topStories[0]?.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getDemoImage(0);
                        }}
                      />
                    </div>
                    <div className="p-4 sm:p-5 md:p-6 bg-black">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'sans-serif' }}>
                        {topStories[0]?.title || 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test'}
                      </h2>
                      <div className="border-t border-white mb-3 sm:mb-4"></div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(topStories[0]?.published_at || topStories[0]?.created_at)}</span>
                        </div>
                        <span className="bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">{topStories[0]?.category_name || topStories[0]?.category?.name || 'NEWS'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            
            {/* 2x2 Grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {topStories.slice(1, 5).map((article, idx) => (
                <Link key={article.id || idx} to={`/news/${article.slug || article.id}`} className="flex flex-col h-full">
                  <div className="bg-black flex flex-col h-full">
                    <div className="h-40 sm:h-44 md:h-40 w-full overflow-hidden flex-shrink-0">
                      <img
                        src={article.featured_image_url || getDemoImage(idx + 1)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getDemoImage(idx + 1);
                        }}
                      />
                    </div>
                    <div className="p-3 sm:p-4 bg-black flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-white mb-2 sm:mb-3 line-clamp-2" style={{ fontFamily: 'sans-serif' }}>
                        {article.title || 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test'}
                      </h3>
                      <div className="border-t border-white mb-2 sm:mb-3"></div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-auto flex-wrap">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(article.published_at || article.created_at)}</span>
                        </div>
                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">{article.category_name || article.category?.name || 'NEWS'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* America Section */}
        {americaArticles.length > 0 && (
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">America</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="md:col-span-1 bg-black flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6">America</h3>
                <Link to={`/news/${americaArticles[0]?.slug || americaArticles[0]?.id}`} className="flex-1 flex flex-col">
                  <div className="h-48 sm:h-56 md:h-64 w-full overflow-hidden">
                    <img
                      src={americaArticles[0]?.featured_image_url || getDemoImage(5)}
                      alt={americaArticles[0]?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getDemoImage(5);
                      }}
                    />
                  </div>
                  <div className="p-4 sm:p-5 md:p-6 flex flex-col grow">
                    <h4 className="text-sm font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'sans-serif' }}>
                      {americaArticles[0]?.title || 'DARPA Seeks Proposals for Lunar Orbiter to Prospect Water Ice and Test Low Orbit Operations'}
                    </h4>
                    <div className="border-t border-white mb-3 sm:mb-4"></div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                      <div className="flex items-center gap-2 text-white text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(americaArticles[0]?.published_at || americaArticles[0]?.created_at)}</span>
                      </div>
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        {americaArticles[0]?.category_name || americaArticles[0]?.category?.name || 'NEWS'}
                      </span>
                    </div>
                    <div className="flex justify-end mt-auto">
                      <Link to="/news/america" className="text-orange-500 hover:text-orange-400 text-xs sm:text-sm font-semibold">
                        See More
                      </Link>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default News;
