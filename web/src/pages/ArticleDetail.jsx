import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedLaunches, setRelatedLaunches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const [articleRes, relatedRes, launchesRes] = await Promise.all([
        axios.get(`${API_URL}/api/news/${slug}`),
        axios.get(`${API_URL}/api/news?limit=4&status=published`),
        axios.get(`${API_URL}/api/launches?limit=3&offset=0`),
      ]);

      setArticle(articleRes.data);
      
      // Handle API response format (may be array or { data: [...] })
      const relatedData = Array.isArray(relatedRes.data) 
        ? relatedRes.data 
        : relatedRes.data?.data || [];
      setRelatedArticles(relatedData.slice(0, 4));
      
      const launchesData = Array.isArray(launchesRes.data) 
        ? launchesRes.data 
        : launchesRes.data?.data || [];
      setRelatedLaunches(launchesData.slice(0, 3));
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading article...
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/news" className="text-orange-500 hover:text-orange-400">
            Return to News
          </Link>
        </div>
      </Layout>
    );
  }

  const sectionNav = (
    <div className="flex items-center gap-6">
      <div className="text-4xl font-bold">NEWS</div>
      <div className="flex items-center gap-4 text-white">
        <span>LAUNCH</span>
        <span>|</span>
        <span>IN SPACE</span>
        <span>|</span>
        <span>TECHNOLOGY</span>
        <span>|</span>
        <span>MILITARY</span>
        <span>|</span>
        <span>FINANCE</span>
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Hero Section */}
      <div
        className="relative h-[50vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(${article.hero_image_url || article.featured_image_url || 'https://via.placeholder.com/1920x600/1a1a1a/ffffff?text=No+Image'})`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-12 w-full">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">{article.title}</h1>
            {article.subtitle && (
              <p className="text-xl md:text-2xl text-gray-300">{article.subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Article Content */}
            <div className="bg-gray-900 p-8 mb-8">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-2 mb-8 flex-wrap">
                {article.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-orange-600 text-black px-4 py-2 text-sm font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Section */}
            {article.author && (
              <div className="bg-gray-900 p-6 mb-8">
                <div className="flex items-start gap-4">
                  {article.author.profile_image_url && (
                    <img
                      src={article.author.profile_image_url}
                      alt={article.author.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{article.author.full_name}</h3>
                    <p className="text-gray-400 mb-2">{article.author.title || 'SPACE NEWS JOURNALIST'}</p>
                    {article.author.bio && (
                      <p className="text-gray-300 text-sm">{article.author.bio}</p>
                    )}
                    <Link
                      to={`/news?author=${article.author.id}`}
                      className="text-orange-500 hover:text-orange-400 text-sm mt-2 inline-block"
                    >
                      More by {article.author.first_name} {article.author.last_name}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">Comments</h3>
              <div className="bg-gray-800 p-4 mb-4 rounded">
                <p className="text-sm text-gray-400 mb-2">
                  SpaceNews requires you to verify your email address before posting.
                </p>
                <button className="text-orange-500 hover:text-orange-400 text-sm">
                  Send verification email
                </button>
              </div>
              <textarea
                placeholder="Join the discussion..."
                className="w-full bg-gray-800 text-white p-4 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Sharing */}
            <div className="bg-gray-900 p-6">
              <div className="flex gap-4 justify-center">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">X</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">@</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                  <span className="text-sm">🔗</span>
                </a>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-900 p-6">
              <h3 className="text-xl font-bold mb-4">SUMMARY</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">NASA TO CANCEL SPACE LAUNCH SYSTEM AND ARTEMIS PROGRAM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">NASA BLOWS UP ROCKET AT NASA KSC MUSEUM BY MISTAKE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span className="text-sm">SLS TRIPS ON NSF VAN DURING ROLLOUT</span>
                </li>
              </ul>
            </div>

            {/* Related Launches */}
            {relatedLaunches.length > 0 && (
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold mb-4">RELATED LAUNCHES</h3>
                <div className="space-y-4">
                  {relatedLaunches.map((launch) => (
                    <Link
                      key={launch.id}
                      to={`/launches/${launch.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="h-32 bg-gray-800 mb-2 rounded"></div>
                      <div className="text-sm font-semibold">{launch.name}</div>
                      <div className="text-xs text-gray-400">
                        {launch.launch_date
                          ? new Date(launch.launch_date).toLocaleDateString()
                          : 'Date TBD'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold mb-4">RELATED STORIES</h3>
                <div className="space-y-4">
                  {relatedArticles
                    .filter((a) => a.id !== article.id)
                    .slice(0, 4)
                    .map((related) => (
                      <Link
                        key={related.id}
                        to={`/news/${related.slug || related.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <div className="h-24 bg-gray-800 mb-2 rounded"></div>
                        <div className="text-sm font-semibold line-clamp-2">{related.title}</div>
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
