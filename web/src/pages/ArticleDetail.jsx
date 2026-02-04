import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
import CommentItem from '../components/CommentItem';
import { useAuth } from '../contexts/AuthContext';
import RedDotLoader from '../components/common/RedDotLoader';

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedLaunches, setRelatedLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [authorImageError, setAuthorImageError] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('newest');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const trending = [
    { label: 'TRENDING', search: 'trending', route: null },
    { label: 'SPACEX', search: 'spacex', route: null },
    { label: 'ARTEMIS 2', search: 'artemis', route: null },
    { label: 'MARS SAMPLE RETURN', search: 'mars sample return', route: null },
    { label: 'DARPA LUNAR ORBITER', search: 'darpa lunar', route: null }
  ];

  useEffect(() => {
    fetchArticle();
  }, [slug]);

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

  const categories = ['NEWS', 'LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];

  // Demo images for articles (placeholder when API does not provide image URL)
  const getDemoImage = (index = 0) => {
    const images = [
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=800&fit=crop',
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=800&fit=crop'
    ];
    return images[index % images.length];
  };

  const fetchArticle = async () => {
    try {
      const articleRes = await axios.get(`${API_URL}/api/news/${slug}`);
      
      if (!articleRes.data) {
        setArticle(null);
        setRelatedArticles([]);
        setRelatedLaunches([]);
        return;
      }

      const articleData = {
        ...articleRes.data,
        hero_image_url: articleRes.data.hero_image_url || 
                       articleRes.data.featured_image_url || 
                       articleRes.data.image_url ||
                       articleRes.data.hero_image ||
                       articleRes.data.image ||
                       getDemoImage(articleRes.data.id || 0),
        featured_image_url: articleRes.data.featured_image_url || 
                            articleRes.data.hero_image_url ||
                            articleRes.data.image_url ||
                            articleRes.data.featured_image ||
                            articleRes.data.image ||
                            getDemoImage(articleRes.data.id || 0)
      };
      setArticle(articleData);
      
      const categorySlug = articleRes.data.category_slug || articleRes.data.category?.slug;
      try {
        const relatedRes = await axios.get(`${API_URL}/api/news`, { 
          params: { 
            limit: 4, 
            status: 'published',
            ...(categorySlug ? { category: categorySlug } : {})
          } 
        });
        const relatedData = Array.isArray(relatedRes.data) ? relatedRes.data : relatedRes.data?.data || [];
        const filteredRelated = relatedData.filter(a => a.id !== articleRes.data.id && a.slug !== slug);
        setRelatedArticles(filteredRelated.length > 0 ? filteredRelated.slice(0, 4) : []);
      } catch (relatedError) {
        console.error('Error fetching related articles:', relatedError);
        setRelatedArticles([]);
      }
      
      try {
        const launchesRes = await axios.get(`${API_URL}/api/launches?limit=3&offset=0`);
        const launchesData = Array.isArray(launchesRes.data) ? launchesRes.data : launchesRes.data?.data || [];
        setRelatedLaunches(launchesData.length > 0 ? launchesData.slice(0, 3) : []);
      } catch (launchesError) {
        console.error('Error fetching related launches:', launchesError);
        setRelatedLaunches([]);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      setArticle(null);
      setRelatedArticles([]);
      setRelatedLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!article?.id) return;
    
    setCommentsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/news/${article.id}/comments`, {
        params: { sort: commentSort, limit: 100, offset: 0, approved: 'true' }
      });
      setComments(response.data.comments || []);
      setCommentsTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
      setCommentsTotal(0);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      const currentUrl = window.location.href;
      const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return;
    }

    if (!newComment.trim() || !article?.id) return;

    try {
      await axios.post(
        `${API_URL}/api/news/${article.id}/comments`,
        { content: newComment.trim() }
      );
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error.response?.status === 401) {
        const currentUrl = window.location.href;
        const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }
  };

  const handleReply = async () => {
    if (!user || !replyContent.trim() || !replyingTo || !article?.id) return;

    try {
      await axios.post(
        `${API_URL}/api/news/${article.id}/comments`,
        { content: replyContent.trim(), parent_comment_id: replyingTo.id }
      );
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleCommentUpdate = async (commentId, content) => {
    try {
      await axios.patch(`${API_URL}/api/news/comments/${commentId}`, { content });
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/news/comments/${commentId}`);
      await fetchComments();
      setCommentsTotal(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return <RedDotLoader fullScreen={true} size="large" color="#fa9a00" />;
  }

  if (!article) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/news" className="text-newstheme hover:text-newstheme/80" style={{ color: '#fa9a00' }}>
            Return to News
          </Link>
        </div>
      </Layout>
    );
  }

  // Ensure article always has image URLs
  if (article && !article.hero_image_url && !article.featured_image_url) {
    article.hero_image_url = getDemoImage(article.id || 0);
    article.featured_image_url = getDemoImage(article.id || 0);
  }

  const sectionNav = (
    <div className="border-t-2 border-white bg-newstheme" style={{ backgroundColor: '#fa9a00' }}>
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
              <div className="absolute top-full left-0 bg-red-500 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime}
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>NEWS</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-0 text-[10px] sm:text-xs uppercase flex-wrap">
            {categories.slice(1).map((cat, idx) => {
              const categorySlugMap = {
                'LAUNCH': '/launches/news',
                'IN SPACE': '/news/in-space',
                'TECHNOLOGY': '/news/technology',
                'MILITARY': '/news/military',
                'FINANCE': '/news/finance',
                'NEWS': '/news'
              };
              const route = categorySlugMap[cat] || '/news';
              
              return (
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
                        if (route) {
                          navigate(route);
                        }
                      }}
                      className="px-1 sm:px-2 py-1 text-white font-normal hover:border-b-2 hover:border-white hover:font-bold transition-all"
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

  // Extract summary points from article content or use defaults
  const summaryPoints = article.summary || [
    'NASA TO CANCEL SPACE LAUNCH SYSTEM AND ARTEMIS PROGRAM',
    'NASA BLOWS UP ROCKET AT NASA KSC MUSEUM BY MISTAKE',
    'SLS TRIPS ON NSF VAN DURING ROLLOUT',
    'PRESS SITE FALLS INTO MASSIVE SINK HOLE TLP CREW WERE NOT ON SITE'
  ];

  // Extract tags from article - API returns array of tag objects
  const tags = article.tags && Array.isArray(article.tags) && article.tags.length > 0
    ? article.tags.map(tag => typeof tag === 'string' ? tag : tag.name || tag.slug?.toUpperCase())
    : article.category_name 
      ? [article.category_name.toUpperCase()]
      : ['NEWS'];

  const currentPageUrl = window.location.href;
  const shareText = `${article.title} - ${article.excerpt || ''}`;

  // Get the image URL for the hero section - always ensure we have an image
  const heroImageUrl = article.hero_image_url || 
                      article.featured_image_url || 
                      article.image_url ||
                      article.hero_image ||
                      article.image ||
                      getDemoImage(article.id || 0);

  return (
    <Layout sectionNav={sectionNav}>
      {/* Trending Sub-Navigation */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-0">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {trending.map((topic, idx) => (
              <div key={idx} className="flex items-center shrink-0">
                {idx > 0 && <span className="text-black mx-2 sm:mx-3">|</span>}
                <button
                  onClick={() => {
                    const categorySlugMap = {
                      'TRENDING': '/news?trending=trending',
                      'SPACEX': '/news?trending=spacex',
                      'ARTEMIS 2': '/news?trending=artemis',
                      'MARS SAMPLE RETURN': '/news?trending=mars-sample-return',
                      'DARPA LUNAR ORBITER': '/news?trending=darpa-lunar'
                    };
                    const route = categorySlugMap[topic.label] || '/news';
                    navigate(route);
                  }}
                  className="text-xs sm:text-sm font-medium text-black transition-colors whitespace-nowrap px-1 sm:px-2 py-0.5 hover:text-newstheme" style={{ '--hover-color': '#fa9a00' }}
                >
                  {topic.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section with Background Image */}
      <div
        className="relative h-[70vh] bg-cover bg-center bg-no-repeat w-full"
        style={{
          backgroundImage: `url(${heroImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '70vh'
        }}
      >
        <div className="absolute inset-0 bg-black/80"></div>
        <div className="relative z-10 h-full flex items-center justify-center pt-16 md:pt-24">
          <div className="max-w-7xl mx-auto px-6 w-full text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-white uppercase tracking-tight leading-tight" style={{ fontFamily: 'Nasalization, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {article.title || 'NASA CANCELS SLS AND ARTEMIS PROGRAM'}
            </h1>
            {article.subtitle && (
              <p className="text-lg md:text-xl lg:text-2xl text-white max-w-5xl mx-auto uppercase leading-relaxed" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {article.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Article Content */}
            <div className="bg-[#121212] border-t-4 border-newstheme mb-8" style={{ borderTopColor: '#fa9a00' }}>
              <div className="p-6">
              <div
                className="prose prose-invert max-w-none text-white text-base leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: article.content 
                    ? article.content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')
                    : article.body || '<p>No content available.</p>' 
                }}
                style={{
                  color: 'white',
                }}
              />
            </div>

            {/* Tags */}
              <div className="px-6 pb-6 flex gap-2 flex-wrap">
              {tags.map((tag, idx) => {
                const tagSlug = tag.toLowerCase().replace(/\s+/g, '-');
                return (
                  <Link
                    key={idx}
                    to={`/news?tag=${encodeURIComponent(tagSlug)}`}
                    className="bg-newstheme text-white px-4 py-2 text-sm font-semibold rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ backgroundColor: '#fa9a00' }}
                  >
                    {tag}
                  </Link>
                );
              })}
              </div>
            </div>

            {/* Author Information Section */}
            <div className="bg-[#121212] p-6 mt-6 border-t-4 border-newstheme" style={{ borderTopColor: '#fa9a00' }}>
              <div className="flex items-start gap-4">
                {/* Profile Picture with orange border */}
                <div className="w-20 h-20 rounded-full shrink-0 border-4 border-newstheme overflow-hidden" style={{ borderColor: '#fa9a00' }}>
                  {!authorImageError && (article.author_image || article.author?.profile_image_url) ? (
                    <img
                      src={article.author_image || article.author.profile_image_url}
                      alt={article.author_name || article.author?.full_name || 'Author'}
                      className="w-full h-full object-cover"
                      onError={() => setAuthorImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#222222] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-400"
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
                
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold inline text-newstheme uppercase tracking-wide" style={{ color: '#fa9a00' }}>
                      {article.author_name || article.author?.full_name || 'ZACHARY AUBERT'}
                    </h3>
                    <span className="text-xl italic text-white uppercase tracking-wide ml-2">
                      {article.author_title || article.author?.title || 'SPACE NEWS JOURNALIST'}
                    </span>
                  </div>
                  {article.author_bio || article.author?.bio ? (
                    <p className="text-sm text-white italic mb-3 leading-relaxed">
                      {article.author_bio || article.author.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-white italic mb-3 leading-relaxed">
                      {article.author_name || 'Zac Aubert'} is a space news journalist covering everything from rocket launches, space tech, and off planet missions.
                    </p>
                  )}
                  <p className="text-sm text-white italic mb-3 leading-relaxed">
                    He doesn't have a book yet but is working on the <span className="italic">Astro Guide: An UnOfficial Guide To The America Space Coast</span>
                  </p>
                  <Link
                    to={`/news/author/${article.author_name ? article.author_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : (article.author_id || article.author?.id || 'zac-aubert')}`}
                    className="text-newstheme hover:text-newstheme/80 text-sm mt-2 inline-block font-semibold transition-colors" style={{ color: '#fa9a00' }}
                  >
                    More by {article.author_first_name || article.author?.first_name || article.author_name?.split(' ')[0] || 'Zac'} {article.author_last_name || article.author?.last_name || article.author_name?.split(' ').slice(1).join(' ') || 'Aubert'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div id="comments" className="bg-[#121212] p-6 mt-6 border-t-4 border-[#fa9a00]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {commentsTotal} {commentsTotal === 1 ? 'Comment' : 'Comments'}
                </h3>
                {user && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-white">{user.full_name || user.username || 'User'}</span>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              {user ? (
                <>
                  {replyingTo ? (
                    <div className="mb-4 p-3 bg-[#222222] rounded border border-[#383838]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Replying to {replyingTo.username || 'comment'}</span>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-[#383838]">
                          {user.profile_image_url ? (
                            <img 
                              src={user.profile_image_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-gray-400"
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
                          )}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-[#222222] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] border border-[#383838] resize-none"
                            rows={3}
                          />
                          <button
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                            className="mt-2 px-4 py-2 bg-newstheme text-white rounded hover:bg-newstheme/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#fa9a00' }}
                          >
                            Post Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center shrink-0 border border-[#383838]">
                        {user.profile_image_url ? (
                          <img 
                            src={user.profile_image_url} 
                            alt={user.username} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-400"
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
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Join the discussion..."
                          className="w-full bg-[#222222] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] border border-[#383838] resize-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Share</span>
                          </div>
                          <button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-newstheme text-white rounded hover:bg-newstheme/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#fa9a00' }}
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-4 p-4 bg-[#222222] rounded border border-[#383838] text-center">
                  <p className="text-gray-400 mb-2">Please log in to join the discussion.</p>
                  <Link
                    to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search + '#comments')}`}
                    className="text-newstheme hover:text-newstheme/80 font-semibold" style={{ color: '#fa9a00' }}
                  >
                    Log In
                  </Link>
                </div>
              )}

              {/* Sort Options */}
              <div className="flex items-center justify-end gap-4 mb-4 pb-4 border-b border-[#222222]">
                <button
                  onClick={() => setCommentSort('best')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'best'
                      ? 'font-semibold text-newstheme border-b-2 border-newstheme'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Best
                </button>
                <button
                  onClick={() => setCommentSort('newest')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'newest'
                      ? 'font-semibold text-newstheme border-b-2 border-newstheme'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setCommentSort('oldest')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'oldest'
                      ? 'font-semibold text-newstheme border-b-2 border-newstheme'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Oldest
                </button>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-8">
                  <RedDotLoader size="medium" color="#fa9a00" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No comments yet. Be the first to comment!</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUser={user}
                      onReply={setReplyingTo}
                      onUpdate={handleCommentUpdate}
                      onDelete={handleCommentDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Sharing Icons */}
            <div className="bg-black p-3 flex gap-2 justify-center">
              <button
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Share on X (Twitter)"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentPageUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">X</span>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Share on Facebook"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPageUrl)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">f</span>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Share on LinkedIn"
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentPageUrl)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: shareText,
                      url: currentPageUrl
                    }).catch(err => console.log('Error sharing:', err));
                  } else {
                    navigator.clipboard.writeText(currentPageUrl);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Email"
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(currentPageUrl)}`;
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-newstheme flex items-center justify-center hover:opacity-90 text-white transition-opacity" style={{ backgroundColor: '#fa9a00' }}
                title="Copy link"
                onClick={() => {
                  navigator.clipboard.writeText(currentPageUrl);
                  alert('Link copied to clipboard!');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-[#121212] border-t-4 border-[#fa9a00]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">SUMMARY</h3>
              <div className="p-4 space-y-3">
                <ul className="space-y-3">
                  {summaryPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#fa9a00] text-lg mt-0.5">●</span>
                      <span className="text-sm text-white">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related Launches */}
            {relatedLaunches.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#fa9a00]">
                <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED LAUNCHES</h3>
                <div className="p-4 space-y-4">
                  {relatedLaunches.map((launch) => (
                    <Link
                      key={launch.id}
                      to={`/launches/${launch.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      {launch.featured_image_url ? (
                        <img
                          src={launch.featured_image_url}
                          alt={launch.name}
                          className="w-full h-32 object-cover mb-2"
                        />
                      ) : (
                        <div className="h-32 bg-gray-800 mb-2"></div>
                      )}
                      <div className="text-sm font-semibold text-white mb-1">
                        {launch.name || 'UNITED LAUNCH ALLIANCE'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {launch.launch_site?.name || launch.location || 'Cape Canaveral, FL, USA'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#fa9a00]">
                <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED STORIES</h3>
                <div className="p-4 space-y-4">
                  {relatedArticles
                    .filter((a) => a.id !== article.id)
                    .slice(0, 4)
                    .map((related) => (
                      <Link
                        key={related.id}
                        to={`/news/${related.slug || related.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        {related.featured_image_url ? (
                          <img
                            src={related.featured_image_url}
                            alt={related.title}
                            className="w-full h-24 object-cover mb-2"
                          />
                        ) : (
                          <div className="h-24 bg-gray-800 mb-2"></div>
                        )}
                        <div className="text-sm font-semibold text-white line-clamp-2">
                          {related.title || 'SpaceX To Move StarHopper To NASA Kennedy Space Center'}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArticleDetail;
