import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';

const CategoryNews = ({ categoryName, categorySlug, routePrefix = '/news' }) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const categories = ['NEWS', 'LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];
  
  // Category slug mapping
  const categorySlugMap = {
    'LAUNCH': 'launch',
    'IN SPACE': 'in-space',
    'TECHNOLOGY': 'technology',
    'MILITARY': 'military',
    'FINANCE': 'finance',
    'NEWS': 'news'
  };

  // Demo images for articles
  const getDemoImage = (index = 0, categorySeed = '') => {
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
    // Create a seed from category slug to ensure different images per category
    const categoryHash = categorySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = (index + categoryHash) % images.length;
    return images[imageIndex];
  };

  // Dummy data for fallback
  const dummyFeaturedArticle = {
    id: 1,
    slug: `featured-${categorySlug}`,
    title: `Featured ${categoryName} Article`,
    excerpt: `This is a featured article in the ${categoryName} category.`,
    featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=800&fit=crop',
    category_name: categoryName,
    published_at: new Date().toISOString(),
  };

  const dummyArticles = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    slug: `${categorySlug}-article-${i + 1}`,
    title: `${categoryName} Article ${i + 1}`,
    excerpt: `This is article ${i + 1} in the ${categoryName} category.`,
    featured_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop',
    category_name: categoryName,
    published_at: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  useEffect(() => {
    fetchArticles();
  }, [categorySlug]);

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

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      const [articlesRes, featuredRes] = await Promise.all([
        axios.get(`${API_URL}/api/news`, { params: { status: 'published', limit: 10, category: categorySlug } }),
        axios.get(`${API_URL}/api/news/featured`, { params: { limit: 1 } }).catch(() => ({ data: [] })),
      ]);

      const articlesData = Array.isArray(articlesRes.data) 
        ? articlesRes.data 
        : articlesRes.data?.data || [];
      
      // Filter featured article by category if available
      let featuredData = Array.isArray(featuredRes.data) 
        ? featuredRes.data 
        : featuredRes.data?.data || [];
      
      // If featured article is not from this category, use first article from this category
      if (featuredData.length > 0 && featuredData[0].category_slug !== categorySlug) {
        const categoryFeatured = articlesData.find(a => a.category_slug === categorySlug || a.category_name === categoryName);
        if (categoryFeatured) {
          featuredData = [categoryFeatured];
        } else if (articlesData.length > 0) {
          featuredData = [articlesData[0]];
        } else {
          featuredData = [];
        }
      }

      if (articlesData.length > 0) {
        setArticles(articlesData);
      } else {
        setArticles(dummyArticles);
      }

      if (featuredData.length > 0) {
        setFeaturedArticle(featuredData[0]);
      } else if (articlesData.length > 0) {
        setFeaturedArticle(articlesData[0]);
      } else {
        setFeaturedArticle(dummyFeaturedArticle);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(dummyArticles);
      setFeaturedArticle(dummyFeaturedArticle);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryRoute = (cat) => {
    if (cat === 'LAUNCH') {
      return '/launches/news';
    } else if (cat === 'NEWS') {
      return '/news';
    } else {
      const slug = categorySlugMap[cat] || cat.toLowerCase().replace(/\s+/g, '-');
      return `${routePrefix}/${slug}`;
    }
  };

  const sectionNav = (
    <div className="bg-newstheme border-t-2 border-white" style={{ backgroundColor: '#fa9a00' }}>
      <div className="max-w-full mx-auto px-6 flex items-center justify-between py-0">
        <div className="flex items-center gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative" style={{ overflow: 'visible', marginTop: '12px' }}>
              <div className="w-14 h-14 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="/TLP Helmet.png" 
                  alt="TLP Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="absolute top-full left-0 bg-red-500 px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime}
              </div>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>{categoryName}</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-0 text-xs uppercase">
            {categories.slice(1).map((cat, idx) => {
              const isActive = cat === categoryName;
              const route = getCategoryRoute(cat);
              
              return (
                <div key={cat} className="flex items-center">
                  {idx > 0 && <span className="mx-1 font-bold text-white">|</span>}
                  {isActive ? (
                    <button
                      className="px-2 py-1 text-white border-b-2 border-white font-bold"
                    >
                      {cat}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(route)}
                      className="px-2 py-1 text-white font-normal hover:text-gray-200"
                    >
                      {cat}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout sectionNav={sectionNav}>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout sectionNav={sectionNav}>
      <div className="w-full px-6 pt-[2px] pb-[2px]">
        {/* Category Header */}
        <div className="flex items-center justify-center mt-8 sm:mt-12 md:mt-16 mb-6">
          <div className="flex-1 h-1 bg-newstheme" style={{ backgroundColor: '#fa9a00' }}></div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white uppercase px-4 sm:px-6 md:px-8" style={{ fontFamily: 'Nasalization, sans-serif' }}>
            {categoryName}
          </h1>
          <div className="flex-1 h-1 bg-newstheme" style={{ backgroundColor: '#fa9a00' }}></div>
        </div>

        {/* Hero Section - Large Featured Article */}
        <div className="mb-6">
          <Link to={`${routePrefix}/${featuredArticle?.slug || featuredArticle?.id}`}>
            <div 
              className="relative h-[600px] overflow-hidden"
              style={{
                backgroundImage: `url(${featuredArticle?.featured_image_url || featuredArticle?.hero_image_url || getDemoImage(0, categorySlug)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(10, 31, 58, 0.5), rgba(0, 0, 0, 0.7))',
                }}
              ></div>
              <div className="absolute inset-0 flex flex-col justify-end items-center p-8 z-10 text-center">
                <h1 
                  className="text-5xl font-bold mb-4 text-white uppercase leading-tight max-w-4xl"
                  style={{ fontFamily: 'Nasalization, sans-serif' }}
                >
                  {featuredArticle?.title || `Featured ${categoryName} Article`}
                </h1>
                <p className="text-lg text-white mb-6 max-w-3xl">
                  {featuredArticle?.excerpt || `This is a featured article in the ${categoryName} category.`}
                </p>
                <button className="px-5 py-2 bg-newstheme text-white rounded-full font-semibold hover:bg-newstheme/90 transition-colors uppercase" style={{ backgroundColor: '#fa9a00' }}>
                  {featuredArticle?.category_name || categoryName}
                </button>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Hero Section - Two Smaller Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {articles.slice(0, 2).map((article, idx) => (
            <Link key={article.id || idx} to={`${routePrefix}/${article.slug || article.id}`}>
              <div 
                className="relative h-[300px] overflow-hidden"
                style={{
                  backgroundImage: `url(${article.featured_image_url || article.hero_image_url || getDemoImage(idx + 1, categorySlug)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(10, 31, 58, 0.5), rgba(0, 0, 0, 0.7))',
                  }}
                ></div>
                <div className="absolute inset-0 flex flex-col justify-end items-center p-6 z-10 text-center">
                  <h3 
                    className="text-lg font-bold mb-2 text-white uppercase leading-tight"
                    style={{ fontFamily: 'Nasalization, sans-serif' }}
                  >
                    {article.title}
                  </h3>
                  <button className="px-4 py-1.5 bg-newstheme text-white rounded-full text-sm font-semibold hover:bg-newstheme/90 transition-colors uppercase" style={{ backgroundColor: '#fa9a00' }}>
                    {article.category_name || categoryName}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Article List Section - 6 Cards */}
        <div className="space-y-4">
          {articles.slice(0, 6).map((article, idx) => (
            <Link key={article.id} to={`${routePrefix}/${article.slug || article.id}`}>
              <div className="grid grid-cols-3 gap-6 bg-black hover:bg-gray-900 transition-colors mb-6">
                {/* Left Side - Image */}
                <div className="col-span-1">
                  <img
                    src={article.featured_image_url || getDemoImage(idx, categorySlug)}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                {/* Right Side - Text Content */}
                <div className="col-span-2 p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-3">
                      {article.title}
                    </h2>
                    <p className="text-sm text-white leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                  
                  {/* Category Tag */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="px-3 py-1 bg-newstheme text-white text-xs font-semibold rounded-full uppercase" style={{ backgroundColor: '#fa9a00' }}>
                      {article.category_name || categoryName}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CategoryNews;

