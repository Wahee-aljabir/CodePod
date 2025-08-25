// Main App component that handles routing and authentication
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProjectList from './components/Projects/ProjectList';
import EditorInterface from './components/Editor/EditorInterface';
import './index.css';

// Main app content component
function AppContent() {
  const { currentUser } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [currentView, setCurrentView] = useState('projects'); // 'projects' or 'editor'
  const [selectedProject, setSelectedProject] = useState(null);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setCurrentView('editor');
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setCurrentView('editor');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentView('projects');
  };

  // Show authentication if user is not logged in
  if (!currentUser) {
    return (
      <div>
        {authMode === 'login' ? (
          <Login onSwitchToSignup={() => setAuthMode('signup')} />
        ) : (
          <Signup onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  // Show main app if user is logged in
  return (
    <div>
      {currentView === 'projects' ? (
        <ProjectList
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
        />
      ) : (
        <EditorInterface
          project={selectedProject}
          onBackToProjects={handleBackToProjects}
        />
      )}
    </div>
  );
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;