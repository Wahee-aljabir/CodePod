import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CodeEditor from '../CodeEditor/CodeEditor';
import LivePreview from '../LivePreview/LivePreview';
import { saveProject, getProject } from '../../services/firestoreService';
import './ProjectEditor.css';

const ProjectEditor = ({ projectId = null }) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [project, setProject] = useState(null);

  // Load existing project if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else {
      // Reset to empty project if no projectId
      setProject(null);
      setProjectName('Untitled Project');
      setIsPublic(false);
      setCode({ html: '', css: '', js: '' });
      setLastSaved(null);
    }
  }, [projectId]);

  const loadProject = async (id) => {
    try {
      console.log('Loading project with ID:', id);
      const projectData = await getProject(id);
      console.log('Loaded project data:', projectData);
      
      // Check if this is a public project that the user doesn't own
      const isOwnProject = projectData.userId === currentUser.uid;
      const isPublicProject = projectData.isPublic;
      
      if (isPublicProject && !isOwnProject) {
        // Create a copy for the user instead of loading the original
        console.log('Creating copy of public project for user');
        
        // Clear project ID to create a new project
        setProject(null);
        setProjectName(`Copy of ${projectData.name || 'Untitled Project'}`);
        setIsPublic(false); // Copies are private by default
        
        // Set code from the original project
        const newCode = {
          html: projectData.html || '',
          css: projectData.css || '',
          js: projectData.js || ''
        };
        setCode(newCode);
        
        // Notify user they're working on a copy
        alert(`You're now working on a copy of "${projectData.name}". This copy is independent from the original project and is set to private by default.`);
      } else {
        // Load the original project (user owns it or it's not public)
        setProject(projectData);
        setProjectName(projectData.name || 'Untitled Project');
        setIsPublic(projectData.isPublic || false);
        
        // Set code with proper structure
        const newCode = {
          html: projectData.html || '',
          css: projectData.css || '',
          js: projectData.js || ''
        };
        console.log('Setting code to:', newCode);
        
        // Set code immediately
        setCode(newCode);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Error loading project: ' + error.message);
    }
  };

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  const handlePublicToggle = () => {
    setIsPublic(!isPublic);
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('Please log in to save projects');
      return;
    }

    // Access control: Check if user owns the project when updating existing projects
    if (project?.id && project?.userId && project.userId !== currentUser.uid) {
      alert('Access denied: You can only save projects that you own. This appears to be someone else\'s project.');
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        name: projectName,
        html: code.html,
        css: code.css,
        js: code.js,
        isPublic: isPublic,
        userEmail: currentUser.email // Add user email for display in community feed
      };

      // Always preserve project ID and createdAt if they exist
      if (project?.id) {
        projectData.id = project.id;
      }
      if (project?.createdAt) {
        projectData.createdAt = project.createdAt;
      }

      console.log('Saving project data:', projectData);
      console.log('Current project state before save:', project);
      const savedProject = await saveProject(currentUser.uid, projectData);
      console.log('Saved project result:', savedProject);
      console.log('Project ID after save:', savedProject.id);
      
      setProject(savedProject);
      setLastSaved(new Date());
      
      const publicStatus = isPublic ? 'public' : 'private';
      alert(`Project saved successfully as ${publicStatus}!`);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewProject = () => {
    setProject(null);
    setProjectName('Untitled Project');
    setIsPublic(false);
    setCode({ html: '', css: '', js: '' });
    setLastSaved(null);
  };

  if (!currentUser) {
    return (
      <div className="project-editor">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to use the project editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-editor">
      <div className="editor-header">
        <div className="project-info">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="project-name-input"
            placeholder="Project Name"
          />
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="editor-actions">
          <div className="project-visibility">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={handlePublicToggle}
              />
              <span className="slider"></span>
            </label>
            <span className={`visibility-label ${isPublic ? 'public' : 'private'}`}>
              {isPublic ? '🌍 Public' : '🔒 Private'}
            </span>
            {isPublic && (
              <span className="public-info">
                Will appear in community feed
              </span>
            )}
          </div>
          <button onClick={handleNewProject} className="btn btn-secondary btn-icon" title="New Project">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn btn-primary btn-icon"
            title={isSaving ? 'Saving...' : 'Save Project'}
          >
            {isSaving ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinning">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                <path d="M21 12C21 7.02944 16.9706 3 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div className="editor-panel">
          <CodeEditor 
            onCodeChange={handleCodeChange}
            initialCode={code}
          />
        </div>
        
        <div className="preview-panel">
          <LivePreview code={code} />
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;