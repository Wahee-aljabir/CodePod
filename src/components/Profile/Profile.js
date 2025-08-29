import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import cloudinaryService from '../../services/cloudinaryService';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    avatarUrl: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          displayName: userData.displayName || currentUser.displayName || '',
          email: currentUser.email || '',
          avatarUrl: userData.avatarUrl || currentUser.photoURL || '',
          bio: userData.bio || ''
        });
      } else {
        // Initialize with auth data if no Firestore document exists
        setProfile({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          avatarUrl: currentUser.photoURL || '',
          bio: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset previous messages
    setError('');
    setSuccess('');

    try {
      setUploading(true);
      
      // Additional client-side validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      }
      
      // Upload to Cloudinary
      const result = await cloudinaryService.uploadAvatar(file);
      
      // Update profile state
      setProfile(prev => ({
        ...prev,
        avatarUrl: result.url
      }));
      
      setSuccess('Avatar uploaded successfully! Don\'t forget to save your changes.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        updatedAt: new Date()
      });
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserProfile(); // Reload original data
    setError('');
  };

  if (loading && !profile.email) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!isEditing && (
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              <img 
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.email)}&background=667eea&color=fff&size=150`} 
                alt="Profile Avatar"
                className="avatar-image"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.email)}&background=667eea&color=fff&size=150`;
                }}
              />
              {uploading && (
                <div className="avatar-overlay">
                  <div className="spinner small"></div>
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="avatar-upload">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="file-input"
                />
                <label htmlFor="avatar-upload" className="upload-btn">
                  {uploading ? 'Uploading...' : 'Change Avatar'}
                </label>
                <p className="upload-hint">Max 5MB • JPG, PNG, GIF</p>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="profile-info">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              {isEditing ? (
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={profile.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your display name"
                  className="form-input"
                />
              ) : (
                <p className="form-value">{profile.displayName || 'Not set'}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <p className="form-value readonly">{profile.email}</p>
              <small className="form-hint">Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              {isEditing ? (
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="form-textarea"
                  rows="4"
                />
              ) : (
                <p className="form-value">{profile.bio || 'No bio added yet'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="profile-actions">
            <button 
              className="save-btn"
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;