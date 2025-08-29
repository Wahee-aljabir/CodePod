import React from 'react';
import { useNavigate } from 'react-router-dom';
import DiscussionCard from './DiscussionCard';
import './DiscussionList.css';

const DiscussionList = () => {
  const navigate = useNavigate();

  // Sample discussion data
  const discussions = [
    {
      id: 1,
      number: 1,
      title: "How to do CSS",
      replies: 3,
      date: "2 hours ago"
    },
    {
      id: 2,
      number: 2,
      title: "JavaScript async/await best practices",
      replies: 7,
      date: "5 hours ago"
    },
    {
      id: 3,
      number: 3,
      title: "React hooks vs class components",
      replies: 12,
      date: "1 day ago"
    },
    {
      id: 4,
      number: 4,
      title: "CSS Grid vs Flexbox when to use which",
      replies: 8,
      date: "2 days ago"
    },
    {
      id: 5,
      number: 5,
      title: "Node.js performance optimization tips",
      replies: 15,
      date: "3 days ago"
    },
    {
      id: 6,
      number: 6,
      title: "Database design patterns for web apps",
      replies: 6,
      date: "1 week ago"
    }
  ];

  const handleDiscussionClick = (discussionId) => {
    navigate(`/discussions/${discussionId}`);
  };

  return (
    <div className="discussion-list glass-container">
      <div className="discussion-list-header">
        <h1 className="discussion-list-title">Discussions</h1>
        <p className="discussion-list-subtitle">
          Join the conversation and share your knowledge
        </p>
      </div>
      
      <div className="discussion-list-content">
        {discussions.map(discussion => (
          <DiscussionCard
            key={discussion.id}
            discussion={discussion}
            onClick={handleDiscussionClick}
          />
        ))}
      </div>
    </div>
  );
};

export default DiscussionList;