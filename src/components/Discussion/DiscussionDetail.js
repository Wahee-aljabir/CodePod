import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DiscussionDetail.css';

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');

  // Sample discussion data
  const discussionData = {
    1: {
      title: "How to do CSS",
      messages: [
        {
          id: 1,
          type: 'question',
          author: 'Alex Johnson',
          content: 'How do I make stuff invisible in CSS?',
          timestamp: '2 hours ago',
          isOwn: false
        },
        {
          id: 2,
          type: 'answer',
          author: 'Sarah Chen',
          content: 'hidden',
          timestamp: '1 hour ago',
          isOwn: true
        },
        {
          id: 3,
          type: 'answer',
          author: 'Mike Wilson',
          content: 'You can use visibility: hidden; or display: none; depending on your needs. visibility: hidden keeps the space, display: none removes it completely.',
          timestamp: '45 minutes ago',
          isOwn: false
        }
      ]
    },
    2: {
      title: "JavaScript async/await best practices",
      messages: [
        {
          id: 1,
          type: 'question',
          author: 'John Doe',
          content: 'What are the best practices for using async/await in JavaScript?',
          timestamp: '5 hours ago',
          isOwn: false
        },
        {
          id: 2,
          type: 'answer',
          author: 'You',
          content: 'Always use try-catch blocks and avoid mixing promises with async/await.',
          timestamp: '4 hours ago',
          isOwn: true
        }
      ]
    }
  };

  const discussion = discussionData[id] || {
    title: "Discussion Not Found",
    messages: []
  };

  const handleBack = () => {
    navigate('/discussions');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    // This would normally send the message to backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="discussion-detail glass-container">
      <div className="discussion-detail-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Discussions
        </button>
        <h1 className="discussion-detail-title">{discussion.title}</h1>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {discussion.messages.map((message, index) => (
            <div
              key={message.id}
              className={`message ${message.type} ${index === 0 ? 'other' : 'own'}`}
            >
              <div className="message-bubble">
                <div className="message-content">{message.content}</div>
                <div className="message-meta">
                  <span className="message-author">{message.author}</span>
                  <span className="message-timestamp">{message.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
            />
            <button type="submit" className="send-button" disabled={!newMessage.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscussionDetail;