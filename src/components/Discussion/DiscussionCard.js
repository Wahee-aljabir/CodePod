import React from 'react';
import './DiscussionCard.css';

const DiscussionCard = ({ discussion, onClick }) => {
  return (
    <div className="discussion-card glass-container" onClick={() => onClick(discussion.id)}>
      <div className="discussion-card-content">
        <div className="discussion-number">{discussion.number}.</div>
        <div className="discussion-info">
          <h3 className="discussion-title">{discussion.title}</h3>
          <div className="discussion-meta">
            <span className="discussion-replies">{discussion.replies} replies</span>
            <span className="discussion-date">{discussion.date}</span>
          </div>
        </div>
      </div>
      <div className="discussion-card-overlay">
        <span className="view-discussion">View Discussion →</span>
      </div>
    </div>
  );
};

export default DiscussionCard;