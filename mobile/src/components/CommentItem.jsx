import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { likeComment, updateComment, deleteComment } from '../services/comments';
import { scale, getResponsiveFontSize, getResponsivePadding } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';

const CommentItem = ({ comment, onReply, onUpdate, onDelete, level = 0, navigation }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [userLiked, setUserLiked] = useState(comment.user_liked || false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user && user.id === comment.user_id;
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
    
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like comments', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') }
      ]);
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await likeComment(comment.id);
      setUserLiked(response.liked);
      setLikeCount(prev => response.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to edit comments', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') }
      ]);
      return;
    }

    if (!editContent.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      const updated = await updateComment(comment.id, editContent);
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to delete comments', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') }
      ]);
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteComment(comment.id);
              if (onDelete) onDelete(comment.id);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete comment');
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleReplyClick = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to reply to comments', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation?.navigate('Login') }
      ]);
      return;
    }
    if (onReply) onReply(comment);
  };

  if (isDeleting) {
    return (
      <View style={styles.deletedContainer}>
        <Text style={styles.deletedText}>Comment deleted...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, level > 0 && styles.nestedContainer]}>
      <View style={styles.commentRow}>
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          {comment.profile_image_url ? (
            <Image 
              source={{ uri: comment.profile_image_url }} 
              style={styles.avatar}
            />
          ) : (
            <Ionicons name="person" size={scale(20)} color="#666666" />
          )}
        </View>

        {/* Comment Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.username}>{comment.username || 'Anonymous'}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(comment.created_at)}</Text>
            {comment.is_approved === false && (
              <Text style={styles.pendingText}>(Pending approval)</Text>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                style={styles.editInput}
                multiline
                numberOfLines={3}
                placeholderTextColor="#666666"
                selectionColor="#8B1A1A"
                underlineColorAndroid="#8B1A1A"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.commentText}>{comment.content}</Text>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={handleLike}
                  disabled={isLiking}
                  style={styles.actionButton}
                >
                  <Ionicons 
                    name={userLiked ? "heart" : "heart-outline"} 
                    size={scale(16)} 
                    color={userLiked ? "#8B1A1A" : "#999999"} 
                  />
                  <Text style={[styles.actionText, userLiked && styles.likedText]}>
                    {likeCount}
                  </Text>
                </TouchableOpacity>

                {level < maxDepth && (
                  <TouchableOpacity
                    onPress={handleReplyClick}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>Reply</Text>
                  </TouchableOpacity>
                )}

                {/* Edit and Delete buttons - only show if user is the owner */}
                {isOwner && (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDelete}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              level={level + 1}
              navigation={navigation}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: getResponsivePadding(16),
  },
  nestedContainer: {
    marginLeft: scale(24),
    marginTop: getResponsivePadding(12),
    paddingLeft: getResponsivePadding(12),
    borderLeftWidth: 2,
    borderLeftColor: '#333333',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsivePadding(12),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(4),
    flexWrap: 'wrap',
  },
  username: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: getResponsivePadding(8),
  },
  timeAgo: {
    fontSize: getResponsiveFontSize(12),
    color: '#666666',
    marginRight: getResponsivePadding(8),
  },
  pendingText: {
    fontSize: getResponsiveFontSize(12),
    color: '#FFA500',
    fontStyle: 'italic',
  },
  commentText: {
    fontSize: getResponsiveFontSize(14),
    color: '#CCCCCC',
    marginBottom: getResponsivePadding(8),
    lineHeight: scale(20),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: getResponsivePadding(16),
  },
  actionText: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
  },
  likedText: {
    color: '#8B1A1A',
  },
  deleteText: {
    color: '#EF4444',
  },
  editContainer: {
    marginTop: getResponsivePadding(8),
  },
  editInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: scale(8),
    padding: getResponsivePadding(12),
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(14),
    minHeight: scale(80),
    textAlignVertical: 'top',
    marginBottom: getResponsivePadding(8),
  },
  editActions: {
    flexDirection: 'row',
    gap: getResponsivePadding(8),
  },
  saveButton: {
    backgroundColor: '#8B1A1A',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: scale(8),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#333333',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: scale(8),
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(14),
  },
  repliesContainer: {
    marginTop: getResponsivePadding(12),
  },
  deletedContainer: {
    paddingVertical: getResponsivePadding(8),
  },
  deletedText: {
    fontSize: getResponsiveFontSize(12),
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default CommentItem;

