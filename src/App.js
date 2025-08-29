import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectEditor from './components/ProjectEditor/ProjectEditor';
import Navigation from './components/Navigation/Navigation';
import DiscussionList from './components/Discussion/DiscussionList';
import DiscussionDetail from './components/Discussion/DiscussionDetail';
import Profile from './components/Profile/Profile';
import './App.css';

<Route path="/profile" element={<Profile />} />
// Wrapper component for Dashboard with navigation functions
function DashboardWrapper() {
  const navigate = useNavigate();

  const handleOpenProject = (projectId) => {
    navigate(`/editor/${projectId}`);
  };

  const handleNewProject = () => {
    navigate('/editor');
  };

  return (
    <>
      <Navigation />
      <Dashboard 
        onOpenProject={handleOpenProject}
        onNewProject={handleNewProject}
      />
    </>
  );
}

// Wrapper component for ProjectEditor with navigation
function ProjectEditorWrapper() {
  const { projectId } = useParams();
  
  return (
    <>
      <Navigation />
      <ProjectEditor projectId={projectId} />
    </>
  );
}

// Wrapper component for DiscussionList with navigation
function DiscussionListWrapper() {
  return (
    <>
      <Navigation />
      <DiscussionList />
    </>
  );
}

// Wrapper component for DiscussionDetail with navigation
function DiscussionDetailWrapper() {
  return (
    <>
      <Navigation />
      <DiscussionDetail />
    </>
  );
}

// Wrapper component for Profile with navigation
function ProfileWrapper() {
  return (
    <>
      <Navigation />
      <Profile />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <ProjectEditorWrapper />
              </ProtectedRoute>
            } />
            <Route path="/editor/:projectId" element={
              <ProtectedRoute>
                <ProjectEditorWrapper />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileWrapper />
              </ProtectedRoute>
            } />
            <Route path="/discussions" element={
              <ProtectedRoute>
                <DiscussionListWrapper />
              </ProtectedRoute>
            } />
            <Route path="/discussions/:id" element={
              <ProtectedRoute>
                <DiscussionDetailWrapper />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;