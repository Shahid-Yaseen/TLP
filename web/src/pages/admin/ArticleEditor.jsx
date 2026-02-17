import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const ArticleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        slug: '',
        author_id: '',
        category_id: '',
        sub_category_id: '',
        country_id: '',
        tag_ids: [],
        featured_image_url: '',
        hero_image_url: '',
        content: '',
        excerpt: '',
        status: 'draft',
        is_featured: false,
        is_trending: false,
        is_interview: false,
        is_top_story: false,
        summary: [],
    });

    // Poll state
    const [pollData, setPolData] = useState({
        question: '',
        options: ['', ''],
    });
    const [includePoll, setIncludePoll] = useState(false);

    // Related launches state
    const [relatedLaunchIds, setRelatedLaunchIds] = useState([]);

    // Dropdown data
    const [authors, setAuthors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [tags, setTags] = useState([]);
    const [launches, setLaunches] = useState([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDropdownData();
        if (isEditMode) {
            fetchArticle();
        }
    }, [id]);

    useEffect(() => {
        // Filter sub-categories based on selected category
        if (formData.category_id) {
            const filtered = categories.filter(cat => cat.parent_id === parseInt(formData.category_id));
            setSubCategories(filtered);
        } else {
            setSubCategories([]);
        }
    }, [formData.category_id, categories]);

    useEffect(() => {
        // Auto-generate slug from title
        if (formData.title && !isEditMode) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, isEditMode]);

    const fetchDropdownData = async () => {
        try {
            const [authorsRes, categoriesRes, countriesRes, tagsRes, launchesRes] = await Promise.all([
                axios.get(`${API_URL}/api/authors`),
                axios.get(`${API_URL}/api/news/categories`),
                axios.get(`${API_URL}/api/countries`),
                axios.get(`${API_URL}/api/news/tags`),
                axios.get(`${API_URL}/api/launches?limit=50`),
            ]);

            setAuthors(authorsRes.data?.data || authorsRes.data || []);

            const categoriesData = categoriesRes.data?.data || categoriesRes.data || [];
            setCategories(categoriesData);

            setCountries(countriesRes.data?.data || countriesRes.data || []);
            setTags(tagsRes.data?.data || tagsRes.data || []);
            setLaunches(launchesRes.data?.data || launchesRes.data || []);
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            setError('Failed to load form data');
        }
    };

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/news/${id}`);
            const article = res.data;

            setFormData({
                title: article.title || '',
                subtitle: article.subtitle || '',
                slug: article.slug || '',
                author_id: article.author_id || '',
                category_id: article.category_id || '',
                sub_category_id: article.sub_category_id || '',
                country_id: article.country_id || '',
                tag_ids: article.tags?.map(t => t.id) || [],
                featured_image_url: article.featured_image_url || '',
                hero_image_url: article.hero_image_url || '',
                content: article.content || '',
                excerpt: article.excerpt || '',
                status: article.status || 'draft',
                is_featured: article.is_featured || false,
                is_trending: article.is_trending || false,
                is_interview: article.is_interview || false,
                is_top_story: article.is_top_story || false,
                summary: article.summary || [],
            });

            // Fetch related launches
            const launchRelRes = await axios.get(`${API_URL}/api/news/${id}/related-launches`).catch(() => ({ data: [] }));
            setRelatedLaunchIds(launchRelRes.data?.map(l => l.id) || []);

            // Fetch poll if exists
            const pollRes = await axios.get(`${API_URL}/api/polls/article/${id}`).catch(() => null);
            if (pollRes?.data) {
                setIncludePoll(true);
                setPolData({
                    question: pollRes.data.question,
                    options: pollRes.data.options.map(o => o.option_text),
                });
            }
        } catch (err) {
            console.error('Error fetching article:', err);
            setError('Failed to load article');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                poll_data: includePoll ? pollData : null,
                related_launch_ids: relatedLaunchIds,
            };

            let response;
            if (isEditMode) {
                response = await axios.patch(`${API_URL}/api/news/${id}`, payload);
            } else {
                response = await axios.post(`${API_URL}/api/news`, payload);
            }

            setSuccess(`Article ${isEditMode ? 'updated' : 'created'} successfully!`);
            setTimeout(() => {
                navigate('/admin/articles');
            }, 1500);
        } catch (err) {
            console.error('Error saving article:', err);
            setError(err.response?.data?.error || 'Failed to save article');
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (tagId) => {
        setFormData(prev => ({
            ...prev,
            tag_ids: prev.tag_ids.includes(tagId)
                ? prev.tag_ids.filter(id => id !== tagId)
                : [...prev.tag_ids, tagId]
        }));
    };

    const handleLaunchToggle = (launchId) => {
        setRelatedLaunchIds(prev =>
            prev.includes(launchId)
                ? prev.filter(id => id !== launchId)
                : [...prev, launchId]
        );
    };

    const addPollOption = () => {
        setPolData(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const removePollOption = (index) => {
        setPolData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const updatePollOption = (index, value) => {
        setPolData(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => i === index ? value : opt)
        }));
    };

    // Rich text editor modules
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    // Get parent categories only (no parent_id)
    const parentCategories = categories.filter(cat => !cat.parent_id);

    if (loading && isEditMode) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading article...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-[#fa9a00] mb-2">
                        {isEditMode ? 'Edit Article' : 'Create New Article'}
                    </h1>
                    <button
                        onClick={() => navigate('/admin/articles')}
                        className="text-gray-400 hover:text-white"
                    >
                        ← Back to Articles
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Basic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    placeholder="auto-generated-from-title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Author</label>
                                <select
                                    value={formData.author_id}
                                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                >
                                    <option value="">Select Author</option>
                                    {authors.map(author => (
                                        <option key={author.id} value={author.id}>
                                            {author.full_name || author.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Categorization */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Categorization</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value, sub_category_id: '' })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                >
                                    <option value="">Select Category</option>
                                    {parentCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Sub-Category</label>
                                <select
                                    value={formData.sub_category_id}
                                    onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    disabled={!formData.category_id || subCategories.length === 0}
                                >
                                    <option value="">Select Sub-Category</option>
                                    {subCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Country</label>
                                <select
                                    value={formData.country_id}
                                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country.id} value={country.id}>{country.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleTagToggle(tag.id)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.tag_ids.includes(tag.id)
                                                ? 'bg-[#fa9a00] text-white'
                                                : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                                }`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Content</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Article Content *</label>
                                <div className="bg-white rounded">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(value) => setFormData({ ...formData, content: value })}
                                        modules={quillModules}
                                        className="text-black"
                                        style={{ minHeight: '300px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Excerpt (Search Result Snippet)</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    rows="2"
                                    placeholder="Brief summary for search results..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Summary Points (One per line)</label>
                                <textarea
                                    value={formData.summary?.join('\n')}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value.split('\n') })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    rows="5"
                                    placeholder="Enter key points, one per line..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Images</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Featured Image URL</label>
                                <input
                                    type="url"
                                    value={formData.featured_image_url}
                                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Hero Image URL</label>
                                <input
                                    type="url"
                                    value={formData.hero_image_url}
                                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                                    className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Poll */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-[#fa9a00]">Poll (Optional)</h2>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includePoll}
                                    onChange={(e) => setIncludePoll(e.target.checked)}
                                    className="mr-2"
                                />
                                <span>Include Poll</span>
                            </label>
                        </div>

                        {includePoll && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Poll Question</label>
                                    <input
                                        type="text"
                                        value={pollData.question}
                                        onChange={(e) => setPolData({ ...pollData, question: e.target.value })}
                                        className="w-full bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                        placeholder="What do you think about...?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Poll Options</label>
                                    {pollData.options.map((option, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => updatePollOption(index, e.target.value)}
                                                className="flex-1 bg-[#222] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa9a00]"
                                                placeholder={`Option ${index + 1}`}
                                            />
                                            {pollData.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePollOption(index)}
                                                    className="px-3 py-2 bg-red-900 hover:bg-red-800 rounded text-white"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addPollOption}
                                        className="mt-2 px-4 py-2 bg-[#fa9a00] hover:bg-[#ffad2a] rounded text-white"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Related Launches */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Related Launches</h2>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {launches.slice(0, 20).map(launch => (
                                <label key={launch.id} className="flex items-center cursor-pointer hover:bg-[#222] p-2 rounded">
                                    <input
                                        type="checkbox"
                                        checked={relatedLaunchIds.includes(launch.id)}
                                        onChange={() => handleLaunchToggle(launch.id)}
                                        className="mr-3"
                                    />
                                    <span className="text-sm">{launch.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="bg-[#1a1a1a] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-[#fa9a00] mb-4">Feature Toggles</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="mr-2"
                                />
                                <span>Featured</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_trending}
                                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                                    className="mr-2"
                                />
                                <span>Trending</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_interview}
                                    onChange={(e) => setFormData({ ...formData, is_interview: e.target.checked })}
                                    className="mr-2"
                                />
                                <span>Interview</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_top_story}
                                    onChange={(e) => setFormData({ ...formData, is_top_story: e.target.checked })}
                                    className="mr-2"
                                />
                                <span>Top Story</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#fa9a00] hover:bg-[#ffad2a] text-white font-bold py-3 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : isEditMode ? 'Update Article' : 'Create Article'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/articles')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleEditor;
