import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import CommentItem from '../components/CommentItem';
import PollCard from '../components/PollCard';
import { useAuth } from '../contexts/AuthContext';
import RedDotLoader from '../components/common/RedDotLoader';

const LaunchNewsDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSectionNav } = useOutletContext();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedLaunches, setRelatedLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [authorImageError, setAuthorImageError] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('newest');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const categories = ['NEWS', 'LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];

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

  useEffect(() => {
    if (article?.id) {
      fetchComments();
    }
  }, [article, commentSort]);

  useEffect(() => {
    if (location.hash === '#comments' && !loading && article) {
      setTimeout(() => {
        const commentsElement = document.getElementById('comments');
        if (commentsElement) {
          commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash, loading, article]);

  const fetchArticle = async () => {
    try {
      const articleRes = await axios.get(`${API_URL}/api/news/${slug}`);

      if (!articleRes.data) {
        setArticle(null);
        setRelatedArticles([]);
        setRelatedLaunches([]);
        return;
      }

      setArticle(articleRes.data);

      try {
        const relatedRes = await axios.get(`${API_URL}/api/news`, {
          params: {
            limit: 4,
            status: 'published',
            category: 'launch'
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
    if (!user || !newComment.trim() || !article?.id) return;

    try {
      await axios.post(
        `${API_URL}/api/news/${article.id}/comments`,
        { content: newComment.trim() }
      );
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
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

  const handleWordHighlight = (word, definition) => {
    setHighlightedWord({ word, definition });
  };

  const sectionNav = (
    <div className="bg-newstheme border-t-2 border-white" style={{ backgroundColor: '#fa9a00' }}>
      <div className="max-w-full mx-auto px-6 flex items-center justify-between py-0">
        <div className="flex items-center gap-8">
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
            <h1 className="text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
          </div>

          <div className="flex items-center gap-0 text-xs uppercase">
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
              const isActive = cat === 'LAUNCH' || article?.category_name === cat;

              return (
                <div key={cat} className="flex items-center">
                  {idx > 0 && <span className="mx-1 font-bold text-white">|</span>}
                  {isActive ? (
                    <button className="px-2 py-1 text-white border-b-2 border-white font-bold">
                      {cat}
                    </button>
                  ) : (
                    <Link
                      to={route}
                      className="px-2 py-1 text-white font-normal hover:text-gray-200"
                    >
                      {cat}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    setSectionNav(sectionNav);
    return () => setSectionNav(null);
  }, [article?.category_name, currentTime]);

  if (loading) {
    return <RedDotLoader fullScreen={true} size="large" color="#fa9a00" />;
  }

  if (!article) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/launches/news" className="text-newstheme hover:text-newstheme/80" style={{ color: '#fa9a00' }}>
            Return to Launch News
          </Link>
        </div>
      </>
    );
  }

  const currentPageUrl = window.location.href;
  const shareText = `${article.title} - ${article.excerpt || ''}`;

  return (
    <>
      {/* Top Banner - MISSION CANCELLED */}
      {article.breaking_news && (
        <div className="relative w-full h-64 bg-black overflow-hidden mb-6">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(${article.featured_image_url || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=800&fit=crop'})`,
            }}
          ></div>
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
            <h1 className="text-6xl md:text-8xl font-bold text-red-600 mb-4 uppercase" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              MISSION CANCELLED
            </h1>
            <div className="bg-red-600 px-4 py-2 mb-2">
              <span className="text-white font-bold uppercase text-sm">BREAKING!</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {article.breaking_news.title}
            </h2>
            <p className="text-white max-w-3xl">
              {article.breaking_news.description}
            </p>
          </div>
        </div>
      )}

      {/* Video Player and Sidebar - Side by Side */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-8">
            {article.video && (
              <div className="bg-[#121212] p-4 sm:p-6">
                <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  {/* Red Border - Inside container */}
                  <div className="absolute top-0 left-4 sm:left-5 bottom-4 sm:bottom-5 w-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                  <div className="absolute top-8 sm:top-10 left-12 sm:left-14 right-4 sm:right-5 h-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                  <div className="absolute top-8 sm:top-10 right-4 sm:right-5 bottom-4 sm:bottom-5 w-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                  <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5 h-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>

                  {/* Background Image */}
                  <div
                    className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('${article.video.thumbnail || article.featured_image_url || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=800&fit=crop'}')`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-black/85 z-10"></div>

                    {/* Branding - Top Left */}
                    <div className="absolute top-0 left-4 sm:left-5 z-20 flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black flex items-center justify-center overflow-hidden">
                        <img
                          src="/TLP Helmet.png"
                          alt="TLP Logo"
                          className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                        />
                      </div>
                      <div className="text-white text-sm sm:text-base md:text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif' }}>THE LAUNCH PAD</div>
                    </div>

                    {/* Website - Top Right */}
                    <div className="absolute top-1 sm:top-2 right-0 z-20 text-white text-[10px] sm:text-xs font-semibold uppercase pr-1 sm:pr-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                      TLPNETWORK.COM
                    </div>

                    {/* Launch Name with Play Button - Centered */}
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                      <div className="text-center relative">
                        <div className="relative">
                          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-none drop-shadow-lg" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                            {article.video.title}
                          </div>

                          {/* Rectangular Play Button */}
                          <button
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 bg-black/80 hover:bg-black/90 flex items-center justify-center shadow-lg backdrop-blur-sm transition-all cursor-pointer z-40"
                            style={{ borderRadius: '4px' }}
                            aria-label="Play video"
                          >
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>

                        {/* Countdown to Launch - Under Title */}
                        <div className="mt-4 sm:mt-6 z-20 relative">
                          <div
                            className="bg-[#8B1A1A] px-6 sm:px-8 md:px-10 py-2 sm:py-2.5 text-white text-sm sm:text-base md:text-lg font-bold uppercase text-center tracking-wider"
                            style={{
                              fontFamily: 'Nasalization, sans-serif',
                              clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                              boxShadow: '0 0 10px rgba(139, 26, 26, 0.5)'
                            }}
                          >
                            {article.video.countdown_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="bg-[#121212] p-6 mt-6">
              <div
                className="prose prose-invert max-w-none text-white text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: article.content
                    ? article.content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')
                    : article.body || '<p>No content available.</p>'
                }}
                style={{ color: 'white' }}
              />

              {/* Polls Section */}
              {article.polls && article.polls.length > 0 && (
                <div className="mt-8">
                  {article.polls.map((poll) => (
                    <PollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-2 mt-8 flex-wrap">
                {article.tags && Array.isArray(article.tags) && article.tags.length > 0
                  ? article.tags.map((tag, idx) => {
                    const tagName = typeof tag === 'string' ? tag : tag.name || tag.slug?.toUpperCase();
                    const tagSlug = typeof tag === 'string' ? tag.toLowerCase().replace(/\s+/g, '-') : (tag.slug || tag.name?.toLowerCase().replace(/\s+/g, '-'));
                    return (
                      <Link
                        key={idx}
                        to={`/news?tag=${encodeURIComponent(tagSlug)}`}
                        className="bg-yellow-500 text-black px-4 py-2 text-sm font-semibold uppercase hover:bg-yellow-600 transition-colors cursor-pointer"
                      >
                        {tagName}
                      </Link>
                    );
                  })
                  : article.category_name && (
                    <Link
                      to={`/news?category=${encodeURIComponent(article.category_name.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="bg-yellow-500 text-black px-4 py-2 text-sm font-semibold uppercase hover:bg-yellow-600 transition-colors cursor-pointer"
                    >
                      {article.category_name}
                    </Link>
                  )
                }
              </div>
            </div>

            {/* Author Information Section */}
            {article.author && (
              <div className="bg-[#121212] p-6 mt-6 border-t-4 border-[#8B1A1A]">
                <div className="flex items-start gap-4">
                  {/* Profile Picture with red border */}
                  <div className="w-20 h-20 rounded-full shrink-0 border-4 border-[#8B1A1A] overflow-hidden">
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
                      <h3 className="text-xl font-bold inline text-[#8B1A1A] uppercase tracking-wide">
                        {(article.author_name || article.author?.full_name || 'ZACHARY AUBERT').toUpperCase()}
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
                      to={`/news?author=${article.author_id || article.author?.id || 'zac-aubert'}`}
                      className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block font-semibold transition-colors"
                    >
                      More by {article.author_first_name || article.author?.first_name || article.author_name?.split(' ')[0] || 'Zac'} {article.author_last_name || article.author?.last_name || article.author_name?.split(' ').slice(1).join(' ') || 'Aubert'}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div id="comments" className="bg-[#121212] p-6 mt-6 border-t-4 border-[#8B1A1A]">
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
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                            className="mt-2 px-4 py-2 bg-[#8B1A1A] text-white rounded hover:bg-[#A02A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                            className="px-4 py-2 bg-[#8B1A1A] text-white rounded hover:bg-[#A02A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="text-[#8B1A1A] hover:text-[#A02A2A] font-semibold"
                  >
                    Log In
                  </Link>
                </div>
              )}

              {/* Sort Options */}
              <div className="flex items-center justify-end gap-4 mb-4 pb-4 border-b border-[#222222]">
                <button
                  onClick={() => setCommentSort('best')}
                  className={`text-sm transition-colors px-1 pb-1 ${commentSort === 'best'
                    ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Best
                </button>
                <button
                  onClick={() => setCommentSort('newest')}
                  className={`text-sm transition-colors px-1 pb-1 ${commentSort === 'newest'
                    ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setCommentSort('oldest')}
                  className={`text-sm transition-colors px-1 pb-1 ${commentSort === 'oldest'
                    ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
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

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Social Sharing Icons */}
            <div className="bg-black p-3 flex gap-2 justify-center">
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <span className="text-sm font-bold">X</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <span className="text-sm font-bold">f</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">SUMMARY</h3>
              <div className="p-4 space-y-3">
                <ul className="space-y-3">
                  {(article.summary || []).map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#8B1A1A] text-lg mt-0.5">●</span>
                      <span className="text-sm text-white">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related Launches */}
            {relatedLaunches.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
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
                        {launch.name || 'United Launch Alliance'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {launch.location || launch.launch_site?.name || 'Cape Canaveral, FL, USA'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
                <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED STORIES</h3>
                <div className="p-4 space-y-4">
                  {relatedArticles.slice(0, 4).map((related) => (
                    <Link
                      key={related.id}
                      to={`/launches/news/${related.slug || related.id}`}
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
                        {related.title || 'LEOcloud to Launch Space Edge Datacenter To ISS by 2025'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LaunchNewsDetail;

