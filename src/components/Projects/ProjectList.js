import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProjects, deleteProject } from '../../services/firestoreService';

function ProjectList({ onSelectProject, onNewProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [currentUser]);

  const loadProjects = async () => {
    if (!currentUser) {
      setError('Please log in to view projects');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const userProjects = await getUserProjects(currentUser.uid);
      setProjects(userProjects);
    } catch (error) {
      setError('Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        setError('Failed to delete project');
        console.error('Error deleting project:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <div className="space-x-4">
            <button
              onClick={onNewProject}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
            >
              New Project
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No projects yet</div>
            <button
              onClick={onNewProject}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onSelectProject(project)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold truncate">
                    {project.title || 'Untitled Project'}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ×
                  </button>
                </div>
                
                <div className="text-gray-400 text-sm mb-4">
                  Updated: {formatDate(project.updatedAt)}
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    HTML: {project.html ? `${project.html.length} chars` : '0 chars'}
                  </div>
                  <div className="text-xs text-gray-500">
                    CSS: {project.css ? `${project.css.length} chars` : '0 chars'}
                  </div>
                  <div className="text-xs text-gray-500">
                    JS: {project.js ? `${project.js.length} chars` : '0 chars'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectList;