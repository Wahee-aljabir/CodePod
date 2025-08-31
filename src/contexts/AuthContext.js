import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    avatarUrl: '',
    avatarColor: '#667eea',
    displayName: '',
    email: ''
  });

  // Load user profile data
  const loadUserProfile = async (user) => {
    if (!user) {
      setUserProfile({
        avatarUrl: '',
        avatarColor: '#667eea',
        displayName: '',
        email: ''
      });
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          avatarUrl: userData.avatarUrl || '',
          avatarColor: userData.avatarColor || '#667eea',
          displayName: userData.displayName || userData.email?.split('@')[0] || '',
          email: userData.email || user.email
        });
      } else {
        // Set default profile for new users
        setUserProfile({
          avatarUrl: '',
          avatarColor: '#667eea',
          displayName: user.email?.split('@')[0] || '',
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile({
        avatarUrl: '',
        avatarColor: '#667eea',
        displayName: user.email?.split('@')[0] || '',
        email: user.email
      });
    }
  };

  // Update user profile (to be called from Profile component)
  const updateUserProfile = (profileData) => {
    setUserProfile(prev => ({
      ...prev,
      ...profileData
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await loadUserProfile(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] = useState(false);

  const loginWithGoogle = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isGoogleSignInInProgress) {
      throw new Error('Google sign-in is already in progress. Please wait.');
    }

    try {
      setIsGoogleSignInInProgress(true);
      console.log('Starting Google sign-in...');
      
      // Clear any existing popup state
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        hd: undefined // Clear any domain hint
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error.code, error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in popup is already open.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Authentication service error. Please try again in a moment.');
      } else {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleSignInInProgress(false);
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    userProfile,
    updateUserProfile,
    loadUserProfile,
    login,
    signup,
    loginWithGoogle,
    logout,
    isGoogleSignInInProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}