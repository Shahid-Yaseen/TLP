import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import API_URL from '../config/api';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [topStories, setTopStories] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('LAUNCH');
  const [timeFilter, setTimeFilter] = useState('TODAY');
  const [trending, setTrending] = useState(['SPACEX', 'ARTEMIS 2', 'MARS SAMPLE RETURN', 'DARPA LUNAR ORBITER']);
  const [stockTicker, setStockTicker] = useState([
    { symbol: 'RKLB', name: 'RocketLab', price: 4.20, change: 0.03, changePercent: 0.72 },
    { symbol: 'SPCE', name: 'Virgin Galactic', price: 1.85, change: -0.05, changePercent: -2.63 },
    { symbol: 'ASTS', name: 'AST SpaceMobile', price: 3.45, change: 0.12, changePercent: 3.60 },
    { symbol: 'RDW', name: 'Redwire', price: 2.30, change: 0.01, changePercent: 0.44 },
    { symbol: 'LILM', name: 'Lilium', price: 0.89, change: -0.02, changePercent: -2.20 },
  ]);
  const [loading, setLoading] = useState(true);

  const categories = ['LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, timeFilter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on time filter
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
        limit: 20,
        offset: 0,
      };

      if (dateFrom) {
        params.date_from = dateFrom;
      }

      if (selectedCategory !== 'LAUNCH') {
        // Map category name to category_id if needed
        // For now, we'll fetch all and filter client-side
      }

      const [articlesRes, featuredRes, trendingRes, interviewsRes] = await Promise.all([
        axios.get(`${API_URL}/api/news`, { params }),
        axios.get(`${API_URL}/api/news?is_featured=true&limit=1`),
        axios.get(`${API_URL}/api/news/trending?limit=10`),
        axios.get(`${API_URL}/api/news`, { params: { status: 'published', limit: 5, search: 'interview' } }),
      ]);

      // Handle API response format (may be array or { data: [...] })
      const articlesData = Array.isArray(articlesRes.data) 
        ? articlesRes.data 
        : articlesRes.data?.data || [];
      setArticles(articlesData);
      
      const featuredData = Array.isArray(featuredRes.data) 
        ? featuredRes.data 
        : featuredRes.data?.data || [];
      if (featuredData.length > 0) {
        setFeaturedArticle(featuredData[0]);
      }
      setTopStories(articlesData.slice(0, 6));

      // Update trending topics from trending articles
      if (trendingRes.data && Array.isArray(trendingRes.data)) {
        const trendingTags = trendingRes.data
          .flatMap(article => article.tags || [])
          .map(tag => tag.name || tag)
          .filter(Boolean)
          .slice(0, 6);
        
        if (trendingTags.length > 0) {
          setTrending([...new Set(trendingTags)]);
        }
      }

      // Fetch interviews (articles with "interview" in title or category)
      const interviewsData = Array.isArray(interviewsRes.data)
        ? interviewsRes.data
        : interviewsRes.data?.data || [];
      setInterviews(interviewsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">NEWS</div>
      <div className="flex items-center gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 transition-colors ${
              selectedCategory === cat
                ? 'bg-white text-black font-semibold'
                : 'text-white hover:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Trending Bar */}
      <div className="bg-black border-b border-gray-800 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">TRENDING</span>
            {trending.map((topic, idx) => (
              <span key={idx} className="text-orange-500 hover:text-orange-400 cursor-pointer">
                {topic}
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="SEARCH"
            className="bg-gray-900 border border-gray-700 px-4 py-1 text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Article */}
        {featuredArticle && (
          <div className="mb-12">
            <ArticleCard article={featuredArticle} size="large" />
            {featuredArticle.tags && featuredArticle.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {featuredArticle.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-orange-600 text-black px-3 py-1 text-sm font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {loading ? (
            <div className="col-span-3 text-center text-gray-400 py-12">Loading articles...</div>
          ) : articles.length > 0 ? (
            articles.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-400 py-12">No articles found</div>
          )}
        </div>

        {/* Recent Interviews */}
        {interviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">RECENT INTERVIEWS</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                {interviews.map((interview) => (
                  <Link
                    key={interview.id}
                    to={`/news/${interview.slug || interview.id}`}
                    className="shrink-0 w-80 bg-gray-900 hover:bg-gray-800 transition-colors p-4 border border-gray-800"
                  >
                    {interview.featured_image_url && (
                      <img
                        src={interview.featured_image_url}
                        alt={interview.title}
                        className="w-full h-48 object-cover mb-4"
                      />
                    )}
                    <div className="text-xs text-gray-400 mb-2">
                      {interview.category_name || 'INTERVIEW'}
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{interview.title}</h3>
                    {interview.author_name && (
                      <div className="text-sm text-gray-400">By {interview.author_name}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Stories */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-2">
            <h2 className="text-2xl font-bold">TOP STORIES</h2>
            <div className="flex gap-4">
              {['TODAY', 'THIS WEEK', 'THIS MONTH'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-1 transition-colors ${
                    timeFilter === filter
                      ? 'bg-white text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {topStories.length > 0 ? (
              topStories.map((article) => (
                <ArticleCard key={article.id} article={article} size="large" />
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-400 py-12">
                No stories found for {timeFilter.toLowerCase()}
              </div>
            )}
          </div>
        </div>

        {/* Stock Ticker */}
        <div className="bg-gray-900 p-4 mb-12 overflow-x-auto border border-gray-800">
          <div className="flex items-center gap-6 whitespace-nowrap">
            <span className="text-white font-semibold">MARKET</span>
            {stockTicker.map((stock, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-white font-semibold">{stock.symbol}</span>
                <span className="text-gray-400">({stock.name})</span>
                <span className="text-white">${stock.price.toFixed(2)}</span>
                <span className={stock.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stock.change >= 0 ? '▲' : '▼'}
                  {Math.abs(stock.change).toFixed(2)}
                </span>
                <span className={stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </span>
              </div>
            ))}
            <Link to="/news/finance" className="text-orange-500 hover:text-orange-400 font-semibold">
              SEE MORE →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default News;
