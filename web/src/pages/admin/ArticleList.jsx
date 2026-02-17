import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const ArticleList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, published, draft, archived
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchArticles();
    }, [filter]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') {
                params.status = filter;
            }

            const res = await axios.get(`${API_URL}/api/news`, { params });
            const data = res.data?.data || res.data || [];
            setArticles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching articles:', err);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this article?')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/news/${id}`);
            fetchArticles();
        } catch (err) {
            console.error('Error deleting article:', err);
            alert('Failed to delete article');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.patch(`${API_URL}/api/news/${id}`, { status: newStatus });
            fetchArticles();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const filteredArticles = articles.filter(article =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-black text-white py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-[#fa9a00]">Article Management</h1>
                    <Link
                        to="/admin/articles/new"
                        className="bg-[#fa9a00] hover:bg-[#ffad2a] text-white font-bold py-2 px-6 rounded"
                    >
                        + Create New Article
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded font-medium ${filter === 'all'
                                        ? 'bg-[#fa9a00] text-white'
                                        : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('published')}
                                className={`px-4 py-2 rounded font-medium ${filter === 'published'
                                        ? 'bg-[#fa9a00] text-white'
                                        : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                    }`}
                            >
                                Published
                            </button>
                            <button
                                onClick={() => setFilter('draft')}
                                className={`px-4 py-2 rounded font-medium ${filter === 'draft'
                                        ? 'bg-[#fa9a00] text-white'
                                        : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                    }`}
                            >
                                Drafts
                            </button>
                            <button
                                onClick={() => setFilter('archived')}
                                className={`px-4 py-2 rounded font-medium ${filter === 'archived'
                                        ? 'bg-[#fa9a00] text-white'
                                        : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                    }`}
                            >
                                Archived
                            </button>
                        </div>
                    </div>
                </div>

                {/* Articles Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400">Loading articles...</div>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">No articles found</div>
                        <Link
                            to="/admin/articles/new"
                            className="inline-block bg-[#fa9a00] hover:bg-[#ffad2a] text-white font-bold py-2 px-6 rounded"
                        >
                            Create Your First Article
                        </Link>
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#222]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Published
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredArticles.map((article) => (
                                        <tr key={article.id} className="hover:bg-[#222]">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {article.featured_image_url && (
                                                        <img
                                                            src={article.featured_image_url}
                                                            alt=""
                                                            className="w-16 h-16 object-cover rounded mr-4"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">{article.title}</div>
                                                        {article.subtitle && (
                                                            <div className="text-sm text-gray-400">{article.subtitle}</div>
                                                        )}
                                                        <div className="flex gap-2 mt-1">
                                                            {article.is_featured && (
                                                                <span className="px-2 py-0.5 bg-yellow-900 text-yellow-200 text-xs rounded">
                                                                    Featured
                                                                </span>
                                                            )}
                                                            {article.is_trending && (
                                                                <span className="px-2 py-0.5 bg-red-900 text-red-200 text-xs rounded">
                                                                    Trending
                                                                </span>
                                                            )}
                                                            {article.is_top_story && (
                                                                <span className="px-2 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                                                                    Top Story
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-300">
                                                    {article.category_name || article.category?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={article.status}
                                                    onChange={(e) => handleStatusChange(article.id, e.target.value)}
                                                    className={`px-3 py-1 rounded text-xs font-medium ${article.status === 'published'
                                                            ? 'bg-green-900 text-green-200'
                                                            : article.status === 'draft'
                                                                ? 'bg-gray-700 text-gray-200'
                                                                : 'bg-gray-800 text-gray-400'
                                                        }`}
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="published">Published</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {formatDate(article.published_at || article.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/news/${article.slug || article.id}`}
                                                        target="_blank"
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        to={`/admin/articles/edit/${article.id}`}
                                                        className="text-[#fa9a00] hover:text-[#ffad2a]"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(article.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-6 text-sm text-gray-400">
                    Showing {filteredArticles.length} of {articles.length} articles
                </div>
            </div>
        </div>
    );
};

export default ArticleList;
