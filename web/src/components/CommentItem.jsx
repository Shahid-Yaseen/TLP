import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { likeComment, updateComment, deleteComment } from '../services/comments';

const CommentItem = ({ comment, currentUser, onReply, onUpdate, onDelete, level = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [userLiked, setUserLiked] = useState(comment.user_liked || false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUser && currentUser.id === comment.user_id;
  const maxDepth = 3; // Maximum nesting depth

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await likeComment(comment.id);
      setUserLiked(response.liked);
      setLikeCount(prev => response.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking comment:', error);
      alert(error.response?.data?.error || 'Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!editContent.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      const updated = await updateComment(comment.id, editContent);
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert(error.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setIsDeleting(true);
    try {
      await deleteComment(comment.id);
      if (onDelete) onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.error || 'Failed to delete comment');
      setIsDeleting(false);
    }
  };

  const handleReplyClick = () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }
    if (onReply) onReply(comment);
  };

  if (isDeleting) {
    return (
      <div className="text-gray-500 text-sm italic py-2">
        Comment deleted...
      </div>
    );
  }

  return (
    <div className={`${level > 0 ? 'ml-6 sm:ml-8 mt-3 border-l-2 border-gray-700 pl-3 sm:pl-4' : ''}`}>
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700">
          {comment.profile_image_url ? (
            <img 
              src={comment.profile_image_url} 
              alt={comment.username || 'User'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400"
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

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">
              {comment.username || 'Anonymous'}
            </span>
            <span className="text-gray-500 text-xs">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.is_approved === false && (
              <span className="text-xs text-yellow-500 italic">(Pending approval)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] border border-gray-700 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-[#8B1A1A] text-white text-sm rounded hover:bg-[#A02A2A] transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-300 text-sm whitespace-pre-wrap wrap-break-word mb-2">
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    userLiked
                      ? 'text-[#8B1A1A] hover:text-[#A02A2A]'
                      : 'text-gray-400 hover:text-[#8B1A1A]'
                  }`}
                >
                  <svg className="w-4 h-4" fill={userLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{likeCount}</span>
                </button>

                {level < maxDepth && (
                  <button
                    onClick={handleReplyClick}
                    className="text-gray-400 hover:text-[#8B1A1A] transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                )}

                {/* Edit and Delete buttons - only show if user is the owner */}
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          const returnUrl = encodeURIComponent(location.pathname + location.search);
                          navigate(`/login?returnUrl=${returnUrl}`);
                          return;
                        }
                        setIsEditing(true);
                      }}
                      className="text-gray-400 hover:text-[#8B1A1A] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;

