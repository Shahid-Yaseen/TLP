import { Link } from 'react-router-dom';

const ArticleCard = ({ article, size = 'normal' }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  const isLarge = size === 'large';

  return (
    <Link
      to={`/news/${article.slug || article.id}`}
      className={`block ${isLarge ? 'col-span-2' : ''} bg-gray-900 hover:bg-gray-800 transition-colors`}
    >
      {article.featured_image_url && (
        <div className={`${isLarge ? 'h-64' : 'h-48'} w-full overflow-hidden`}>
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400/1a1a1a/ffffff?text=No+Image';
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>{formatDate(article.published_at || article.created_at)}</span>
          {article.category && (
            <>
              <span>•</span>
              <span className="text-orange-500">{article.category.name}</span>
            </>
          )}
        </div>
        <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold mb-2 line-clamp-2`}>
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-gray-400 line-clamp-2">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
};

export default ArticleCard;
