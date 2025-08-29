import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { addComment, getComments, likeComment, deleteComment } from '../../services/discussionService';
import './Discussion.css';

const Discussion = ({ projectId, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      loadComments();
    }
  }, [isOpen, projectId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await getComments(projectId);
      setComments(commentsData);
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      const commentData = {
        text: newComment.trim(),
        projectId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        parentId: null,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      };

      const savedComment = await addComment(commentData);
      setComments(prev => [savedComment, ...prev]);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !replyTo) return;

    try {
      const replyData = {
        text: replyText.trim(),
        projectId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        parentId: replyTo.id,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      };

      const savedReply = await addComment(replyData);
      setComments(prev => [savedReply, ...prev]);
      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      setError('Failed to add reply');
      console.error('Error adding reply:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUser) return;

    try {
      await likeComment(commentId, currentUser.uid);
      // Reload comments to get updated like counts
      loadComments();
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    try {
      await deleteComment(commentId, currentUser.uid);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError('Failed to delete comment');
      console.error('Error deleting comment:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getThreadedComments = () => {
    const topLevelComments = comments.filter(comment => !comment.parentId);
    const replies = comments.filter(comment => comment.parentId);

    return topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parentId === comment.id)
    }));
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const isOwner = currentUser && comment.userId === currentUser.uid;
    const hasLiked = currentUser && comment.likedBy?.includes(currentUser.uid);

    return (
      <div className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
        <div className="comment-avatar">
          <div className="avatar-circle">
            {comment.userName?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
        <div className="comment-content">
          <div className="comment-header">
            <span className="comment-author">{comment.userName}</span>
            <span className="comment-date">{formatDate(comment.createdAt)}</span>
            {isOwner && (
              <button 
                className="comment-delete"
                onClick={() => handleDeleteComment(comment.id)}
                title="Delete comment"
              >
                🗑️
              </button>
            )}
          </div>
          <p className="comment-text">{comment.text}</p>
          <div className="comment-actions">
            <button 
              className={`comment-like ${hasLiked ? 'liked' : ''}`}
              onClick={() => handleLikeComment(comment.id)}
              disabled={!currentUser}
            >
              ❤️ {comment.likes || 0}
            </button>
            {!isReply && currentUser && (
              <button 
                className="comment-reply-btn"
                onClick={() => setReplyTo(comment)}
              >
                💬 Reply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="discussion-overlay" onClick={onClose}>
      <div className="discussion-modal glass-container" onClick={(e) => e.stopPropagation()}>
        <div className="discussion-header">
          <h2>💬 Project Discussion</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="discussion-content">
          {currentUser ? (
            <form className="comment-form" onSubmit={handleAddComment}>
              <div className="form-group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this project..."
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="form-actions">
                <span className="char-count">{newComment.length}/500</span>
                <button type="submit" disabled={!newComment.trim()}>
                  💬 Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="auth-prompt">
              <p>Please log in to join the discussion</p>
            </div>
          )}

          <div className="comments-section">
            {loading ? (
              <div className="loading-comments">
                <div className="spinner"></div>
                <p>Loading comments...</p>
              </div>
            ) : (
              <div className="comments-list">
                {getThreadedComments().length > 0 ? (
                  getThreadedComments().map(comment => (
                    <div key={comment.id} className="comment-thread">
                      <CommentItem comment={comment} />
                      {comment.replies?.map(reply => (
                        <CommentItem key={reply.id} comment={reply} isReply={true} />
                      ))}
                      {replyTo?.id === comment.id && currentUser && (
                        <form className="reply-form" onSubmit={handleAddReply}>
                          <div className="form-group">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${comment.userName}...`}
                              rows={2}
                              maxLength={300}
                            />
                          </div>
                          <div className="form-actions">
                            <button 
                              type="button" 
                              onClick={() => setReplyTo(null)}
                              className="btn-cancel"
                            >
                              Cancel
                            </button>
                            <button type="submit" disabled={!replyText.trim()}>
                              💬 Reply
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-comments">
                    <div className="empty-icon">💬</div>
                    <h3>No comments yet</h3>
                    <p>Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discussion;