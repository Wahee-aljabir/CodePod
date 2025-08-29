import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { getUserProjects, getPublicProjects, deleteProject } from '../../services/firestoreService'; // Add missing imports
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal'; // Add missing import
import cloudinaryService from '../../services/cloudinaryService';
import './Dashboard.css';

const Dashboard = ({ onOpenProject, onNewProject }) => {
  const { currentUser } = useAuth();
  const [userProjects, setUserProjects] = useState([]);
  const [communityProjects, setCommunityProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const [deleting, setDeleting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentUser) {
        const userProjectsData = await getUserProjects(currentUser.uid);
        setUserProjects(userProjectsData || []);
      }
      
      const communityProjectsData = await getPublicProjects();
      setCommunityProjects(communityProjectsData || []);
    } catch (err) {
      console.error('Error loading pods:', err);
      setError('Failed to load pods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (project) => {
    setDeleteModal({ isOpen: true, project });
  };

  const confirmDeleteProject = async () => {
    if (!deleteModal.project) return;
    
    try {
      setDeleting(true);
      await deleteProject(deleteModal.project.id, currentUser.uid);
      
      // Remove the project from the local state
      setUserProjects(prev => prev.filter(p => p.id !== deleteModal.project.id));
      
      setDeleteModal({ isOpen: false, project: null });
    } catch (err) {
      console.error('Error deleting pod:', err);
      setError('Failed to delete pod. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, project: null });
  };

  const PodCard = ({ project, isUserProject = false, size = 'normal' }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const hasContent = project.html || project.css || project.js;
    
    const handleThumbnailUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      setUploadingThumbnail(true);
      try {
        const result = await cloudinaryService.uploadThumbnail(file);
        
        // Update project with thumbnail URL in Firestore
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          thumbnailUrl: result.url,
          thumbnailPublicId: result.publicId
        });
        
        // Update local state
        project.thumbnailUrl = result.url;
        
        // Reload projects to reflect changes
        loadProjects();
      } catch (error) {
        console.error('Error uploading thumbnail:', error);
        alert('Failed to upload thumbnail: ' + error.message);
      } finally {
        setUploadingThumbnail(false);
      }
    };

    const handleMenuClick = (e) => {
      e.stopPropagation();
      setShowDropdown(!showDropdown);
    };
    
    const handleDeleteClick = (e) => {
      e.stopPropagation();
      handleDeleteProject(project);
      setShowDropdown(false);
    };

    const getUserInitials = (email) => {
      if (!email) return 'A';
      return email.split('@')[0].charAt(0).toUpperCase();
    };
    
    return (
      <div className={`pod-card ${size === 'small' ? 'pod-card-small' : ''}`} onClick={() => onOpenProject(project.id)}>
        <div className="pod-preview">
          {project.thumbnailUrl ? (
            <img 
              src={project.thumbnailUrl} 
              alt={`${project.name} thumbnail`}
              className="pod-thumbnail"
            />
          ) : hasContent ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { margin: 0; padding: 8px; font-family: 'Inter', Arial, sans-serif; overflow: hidden; }
                      ${project.css || ''}
                    </style>
                  </head>
                  <body>
                    ${project.html || ''}
                    <script>
                      try {
                        ${project.js || ''}
                      } catch(e) {
                        console.error('Script error:', e);
                      }
                    </script>
                  </body>
                </html>
              `}
              title={project.name}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          ) : (
            <div className="empty-preview">
              <div className="empty-icon">🚀</div>
              <span>Empty Pod</span>
            </div>
          )}
        </div>
        
        <div className="pod-info">
          <div className="pod-header">
            <div className="user-avatar">
              {isUserProject && userProfile?.avatarUrl && !avatarError ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt="User avatar" 
                  className="avatar-image"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="avatar-initials" style={{ backgroundColor: userProfile?.avatarColor || '#667eea' }}>
                  {isUserProject ? getUserInitials(currentUser?.email) : getUserInitials(project.userEmail)}
                </div>
              )}
            </div>
            <div className="pod-details">
              <h3 className="pod-name">{project.name || 'Untitled Pod'}</h3>
              <span className="author">by {isUserProject ? (userProfile?.displayName || currentUser?.email?.split('@')[0] || 'You') : (project.userEmail?.split('@')[0] || 'Anonymous')}</span>
            </div>
            <div className="pod-actions">
              {project.isPublic && (
                <span className="world-icon" title="Public Pod">🌍</span>
              )}
              {isUserProject && (
                <>
                  <label className="thumbnail-upload-btn" title="Upload Thumbnail">
                    {uploadingThumbnail ? '⏳' : '📷'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="thumbnail-file-input"
                      disabled={uploadingThumbnail}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <div className="pod-menu">
                    <button className="menu-trigger" onClick={handleMenuClick}>
                      ⋮
                    </button>
                    {showDropdown && (
                      <div className="menu-dropdown">
                        <button className="menu-item delete-item" onClick={handleDeleteClick}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard glass-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading pods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard glass-container">
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadProjects} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      )}
      
      <div className="dashboard-header">
        <div className="header-section">
          <h1 className="dashboard-title">
            <span className="brand-icon">🚀</span>
            CodePod
            <span className="brand-subtitle">Your Creative Coding Space</span>
          </h1>
          <button onClick={onNewProject} className="btn btn-primary new-pod-btn">
            <span className="btn-icon">✨</span>
            New Pod
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="user-pods-section">
          <div className="section-header">
            <h2>Your Pods</h2>
            <span className="pod-count">{userProjects.length} pods</span>
          </div>
          
          <div className="pods-horizontal-bar">
            {userProjects.length > 0 ? (
              userProjects.slice(0, 6).map(project => (
                <PodCard 
                  key={project.id} 
                  project={project} 
                  isUserProject={true}
                  size="small"
                />
              ))
            ) : (
              <div className="empty-pod-card" onClick={onNewProject}>
                <div className="empty-preview">
                  <span className="plus-icon">+</span>
                </div>
                <div className="pod-info">
                  <h3>Create your first pod</h3>
                  <p>Start coding now!</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="community-pods-section">
          <div className="section-header">
            <h2>Community Showcase</h2>
            <span className="pod-count">{communityProjects.length} public pods</span>
          </div>
          
          <div className="pods-grid">
            {communityProjects.length > 0 ? (
              communityProjects.slice(0, 8).map(project => (
                <PodCard 
                  key={project.id} 
                  project={project} 
                  isUserProject={false}
                />
              ))
            ) : (
              <div className="empty-community">
                <div className="empty-icon">🌍</div>
                <h3>No public pods yet</h3>
                <p>Be the first to share your creation!</p>
                <button onClick={onNewProject} className="btn btn-primary">
                  Create Public Pod
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteProject}
        title="Delete Pod"
        message={`Are you sure you want to delete "${deleteModal.project?.name || 'this pod'}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default Dashboard;