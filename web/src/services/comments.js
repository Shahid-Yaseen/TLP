import axios from 'axios';
import API_URL from '../config/api';

/**
 * Get comments for a launch
 * @param {number} launchId - Launch ID
 * @param {string} sort - Sort order: 'best', 'newest', 'oldest'
 * @param {number} limit - Number of comments to fetch
 * @param {number} offset - Pagination offset
 * @returns {Promise} Comments response with nested replies
 */
export const getLaunchComments = async (launchId, sort = 'newest', limit = 100, offset = 0) => {
  try {
    const response = await axios.get(`${API_URL}/api/launches/${launchId}/comments`, {
      params: { sort, limit, offset, approved: 'true' }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Create a new comment on a launch
 * @param {number} launchId - Launch ID
 * @param {string} content - Comment content
 * @param {number|null} parentCommentId - Parent comment ID for replies (optional)
 * @returns {Promise} Created comment object
 */
export const createLaunchComment = async (launchId, content, parentCommentId = null) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/launches/${launchId}/comments`,
      { content, parent_comment_id: parentCommentId }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {string} content - Updated comment content
 * @returns {Promise} Updated comment object
 */
export const updateComment = async (commentId, content) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/launches/comments/${commentId}`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/launches/comments/${commentId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Like or unlike a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise} Like status { liked: boolean }
 */
export const likeComment = async (commentId) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/launches/comments/${commentId}/like`
    );
    return response.data;
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

