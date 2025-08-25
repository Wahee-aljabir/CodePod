// Main App component that handles routing and authentication
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
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
  const { currentUser, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot-password'

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Header with username display */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold text-white">CodePen Clone</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  Welcome, {currentUser.displayName || 'User'}!
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <ProjectList />
      </div>
    );
  }

  return (
    <div className="App">
      {authMode === 'login' && (
        <Login 
          onSwitchToSignup={() => setAuthMode('signup')} 
          onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
        />
      )}
      {authMode === 'signup' && (
        <Signup onSwitchToLogin={() => setAuthMode('login')} />
      )}
      {authMode === 'forgot-password' && (
        <ForgotPassword onBackToLogin={() => setAuthMode('login')} />
      )}
    </div>
  );
}

export default App;