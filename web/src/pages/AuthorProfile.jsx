import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
import RedDotLoader from '../components/common/RedDotLoader';

const AuthorProfile = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const authorSlugFromQuery = searchParams.get('author');
  const authorSlug = slug || authorSlugFromQuery;
  const navigate = useNavigate();
  
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [authorImageError, setAuthorImageError] = useState(false);

  // Generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Demo images for articles
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

  useEffect(() => {
    if (authorSlug) {
      fetchAuthorData();
    }
  }, [authorSlug]);

  useEffect(() => {
    if (author) {
      fetchAuthorArticles();
    }
  }, [author]);

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

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/authors/${encodeURIComponent(authorSlug)}`);
      if (response.data) {
        setAuthor(response.data);
      } else {
        setAuthor(null);
      }
    } catch (error) {
      console.error('Error fetching author:', error);
      console.error('Author slug:', authorSlug);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setAuthor(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorArticles = async () => {
    if (!author || !author.id) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/news`, {
        params: {
          status: 'published',
          author_id: author.id,
          limit: 50,
          offset: 0
        }
      });

      const articlesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];

      // Add demo images to articles
      const articlesWithImages = articlesData.map((article, idx) => ({
        ...article,
        featured_image_url: article.featured_image_url || getDemoImage(idx)
      }));

      setArticles(articlesWithImages);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const sectionNav = (
    <div className="border-t-2 border-white" style={{ backgroundColor: '#fa9a00' }}>
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between py-0">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" style={{ overflow: 'visible', marginTop: '12px' }}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="/TLP Helmet.png" 
                  alt="TLP Logo" 
                  className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                />
              </div>
              <div className="absolute top-full left-0 bg-red-500 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime}
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>NEWS</h1>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <RedDotLoader fullScreen={true} size="large" color="#fa9a00" />;
  }

  if (!author) {
    return (
      <Layout sectionNav={sectionNav}>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Author not found
        </div>
      </Layout>
    );
  }

  const authorName = author.full_name || `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Author';
  const authorTitle = author.title || 'SPACE NEWS JOURNALIST';
  const authorBio = author.bio || `${authorName} is a space news journalist covering everything from rocket launches, space tech, and off planet missions.`;
  const authorSlugFromName = generateSlug(authorName);

  return (
    <Layout sectionNav={sectionNav}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Modern Author Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8">
            {/* Large Profile Picture */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 border-4 border-newstheme overflow-hidden shadow-lg" style={{ borderColor: '#fa9a00' }}>
              {!authorImageError && author.profile_image_url ? (
                <img
                  src={author.profile_image_url}
                  alt={authorName}
                  className="w-full h-full object-cover"
                  onError={() => setAuthorImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 md:h-20 md:w-20 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Author Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                {authorName}
              </h1>
              <p className="text-lg md:text-xl text-newstheme mb-4 italic" style={{ color: '#fa9a00' }}>
                {authorTitle}
              </p>
              {author.articles_count !== undefined && (
                <p className="text-sm text-gray-400 mb-4">
                  {author.articles_count} {author.articles_count === 1 ? 'Article' : 'Articles Published'}
                </p>
              )}
              {authorBio && (
                <p className="text-base text-gray-300 leading-relaxed max-w-3xl mx-auto md:mx-0">
                  {authorBio}
                </p>
              )}
              {author.book_info && typeof author.book_info === 'object' && author.book_info.upcoming_books && (
                <div className="mt-4 text-sm text-gray-400 italic">
                  {author.book_info.upcoming_books.map((book, idx) => (
                    <p key={idx}>Working on: <span className="text-newstheme" style={{ color: '#fa9a00' }}>{book.title}</span></p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured Article - Modern Blog Style */}
        {articles.length > 0 && (
          <div className="mb-12">
            <Link to={`/news/${articles[0]?.slug || articles[0]?.id}`} className="block group">
              <div className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${articles[0]?.featured_image_url || articles[0]?.hero_image_url || getDemoImage(0)})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                  <div className="mb-4">
                    <span className="inline-block px-4 py-2 bg-newstheme text-white text-sm font-semibold rounded-full uppercase" style={{ backgroundColor: '#fa9a00' }}>
                      {articles[0]?.category_name || articles[0]?.category?.name || 'NEWS'}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                    {articles[0]?.title}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-200 mb-4 line-clamp-2">
                    {articles[0]?.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>{formatDate(articles[0]?.published_at || articles[0]?.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Articles Grid - Modern Blog Layout */}
        {articles.length > 1 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 pb-4 border-b border-gray-700">
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {articles.slice(1).map((article, idx) => (
                <Link 
                  key={article.id} 
                  to={`/news/${article.slug || article.id}`}
                  className="group block"
                >
                  <article className="bg-[#121212] rounded-lg overflow-hidden hover:bg-[#1a1a1a] transition-all duration-300 h-full flex flex-col">
                    {/* Article Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.featured_image_url || getDemoImage(idx + 1)}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-newstheme text-white text-xs font-semibold rounded-full uppercase" style={{ backgroundColor: '#fa9a00' }}>
                          {article.category_name || article.category?.name || 'NEWS'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Article Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-newstheme transition-colors" style={{ fontFamily: 'sans-serif' }}>
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {articles.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg">No articles found for this author.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuthorProfile;
