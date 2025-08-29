import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProjects, getPublicProjects, deleteProject } from '../../services/firestoreService';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import './Dashboard.css';

const Dashboard = ({ onOpenProject, onNewProject }) => {
  const { currentUser } = useAuth();
  const [userProjects, setUserProjects] = useState([]);
  const [communityProjects, setCommunityProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const [deleting, setDeleting] = useState(false);

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
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (project) => {
    setDeleteModal({ isOpen: true, project });
  };

  const confirmDeleteProject = async () => {
    if (!deleteModal.project || !currentUser) return;
    
    try {
      setDeleting(true);
      await deleteProject(deleteModal.project.id, currentUser.uid);
      
      // Remove the project from the local state
      setUserProjects(prev => prev.filter(p => p.id !== deleteModal.project.id));
      
      setDeleteModal({ isOpen: false, project: null });
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, project: null });
  };

  const ProjectCard = ({ project, isUserProject = false, size = 'normal' }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const hasContent = project.html || project.css || project.js;
    
    const handleMenuClick = (e) => {
      e.stopPropagation();
      setShowDropdown(!showDropdown);
    };
    
    const handleDeleteClick = (e) => {
      e.stopPropagation();
      handleDeleteProject(project);
      setShowDropdown(false);
    };
    
    return (
      <div className={`project-card ${size === 'small' ? 'project-card-small' : ''}`} onClick={() => onOpenProject(project.id)}>
        <div className="project-preview">
          {hasContent ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { margin: 0; padding: 8px; font-family: Arial, sans-serif; overflow: hidden; }
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
              <div className="empty-icon">📄</div>
              <span>Empty Project</span>
            </div>
          )}
        </div>
        
        <div className="project-info">
          <div className="project-header">
            <div className="user-avatar">
              {(project.userEmail?.split('@')[0] || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="project-details">
              <h3 className="project-name">{project.name || 'Untitled Project'}</h3>
              <span className="author">by {project.userEmail?.split('@')[0] || 'Anonymous'}</span>
            </div>
            {project.isPublic && (
              <span className="world-icon" title="Public Project">🌍</span>
            )}
            {isUserProject && (
              <div className="project-menu">
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
            )}
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
          <p>Loading projects...</p>
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
          <h1 className="dashboard-title">CodePod</h1>
          <button onClick={onNewProject} className="btn btn-primary new-project-btn">
            + New Project
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="user-projects-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <span className="project-count">{userProjects.length} projects</span>
          </div>
          
          <div className="projects-horizontal-bar">
            {userProjects.length > 0 ? (
              userProjects.slice(0, 6).map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isUserProject={true}
                  size="small"
                />
              ))
            ) : (
              <div className="empty-project-card" onClick={onNewProject}>
                <div className="empty-preview">
                  <span className="plus-icon">+</span>
                </div>
                <div className="project-info">
                  <h3>Create your first project</h3>
                  <p>Start coding now!</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="community-projects-section">
          <div className="section-header">
            <h2>Community Showcase</h2>
            <span className="project-count">{communityProjects.length} public projects</span>
          </div>
          
          <div className="projects-grid">
            {communityProjects.length > 0 ? (
              communityProjects.slice(0, 8).map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isUserProject={false}
                />
              ))
            ) : (
              <div className="empty-community">
                <div className="empty-icon">🌍</div>
                <h3>No public projects yet</h3>
                <p>Be the first to share your creation!</p>
                <button onClick={onNewProject} className="btn btn-primary">
                  Create Public Project
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
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModal.project?.name || 'this project'}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};

export default Dashboard;