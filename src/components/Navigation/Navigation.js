import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarColor, setAvatarColor] = useState('#667eea');
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate random color
  const generateRandomColor = () => {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
      '#ff9a9e', '#fecfef', '#ffeaa7', '#fab1a0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Get user initials
  const getUserInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Load or generate avatar color
  useEffect(() => {
    const loadAvatarColor = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists() && userDoc.data().avatarColor) {
          setAvatarColor(userDoc.data().avatarColor);
        } else {
          // Generate and save new color
          const newColor = generateRandomColor();
          await setDoc(doc(db, 'users', currentUser.uid), {
            avatarColor: newColor,
            email: currentUser.email,
            createdAt: new Date()
          }, { merge: true });
          setAvatarColor(newColor);
        }
      } catch (error) {
        console.error('Error loading avatar color:', error);
        setAvatarColor(generateRandomColor());
      }
    };

    loadAvatarColor();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDashboard = () => {
    navigate('/');
    setShowDropdown(false);
  };

  if (!currentUser) return null;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>CodePod</h2>
        </div>
        
        <div className="nav-actions">
          <div className="profile-dropdown">
            <button 
              className="profile-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ backgroundColor: avatarColor }}
            >
              {getUserInitials(currentUser.email)}
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div 
                    className="dropdown-avatar"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {getUserInitials(currentUser.email)}
                  </div>
                  <div className="dropdown-info">
                    <span className="dropdown-email">{currentUser.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleDashboard}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Dashboard
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/discussions'); setShowDropdown(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Discussions
                </button>
                <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Profile
                </button>
                <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19.4 15C19.2669 15 19.1538 14.9231 19.0769 14.8462C19 14.7692 19 14.6538 19 14.5385V9.46154C19 9.34615 19 9.23077 19.0769 9.15385C19.1538 9.07692 19.2669 9 19.4 9H20.6C20.7331 9 20.8462 9.07692 20.9231 9.15385C21 9.23077 21 9.34615 21 9.46154V14.5385C21 14.6538 21 14.7692 20.9231 14.8462C20.8462 14.9231 20.7331 15 20.6 15H19.4Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;