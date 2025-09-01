import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult
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

    // Handle redirect result for Google sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google redirect sign-in successful:', result.user.email);
          setIsGoogleSignInInProgress(false);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        setIsGoogleSignInInProgress(false);
      }
    };
    
    handleRedirectResult();

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] = useState(false);
  const [useRedirect, setUseRedirect] = useState(false);

  const loginWithGoogle = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isGoogleSignInInProgress) {
      throw new Error('Google sign-in is already in progress. Please wait.');
    }

    try {
      setIsGoogleSignInInProgress(true);
      console.log('Starting Google sign-in...');
      console.log('Current domain:', window.location.hostname);
      console.log('Firebase auth domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
      
      // Clear any existing popup state
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        hd: undefined // Clear any domain hint
      });
      
      // Try popup first, fallback to redirect if it fails
      if (useRedirect) {
        console.log('Using redirect method for Google sign-in');
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, googleProvider);
        return; // Redirect will handle the rest
      } else {
        console.log('Using popup method for Google sign-in');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign-in successful:', result.user.email);
        return result;
      }
    } catch (error) {
      console.error('Google sign-in error:', error.code, error.message);
      console.error('Full error object:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Popup closed by user, switching to redirect method');
        setUseRedirect(true);
        throw new Error('Sign-in popup was closed. Click "Try Redirect" to use an alternative method.');
      } else if (error.code === 'auth/popup-blocked') {
        console.log('Popup blocked, switching to redirect method');
        setUseRedirect(true);
        throw new Error('Popup was blocked. Click "Try Redirect" to use an alternative method.');
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

  const loginWithGoogleRedirect = async () => {
    try {
      setIsGoogleSignInInProgress(true);
      console.log('Starting Google redirect sign-in...');
      
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Google redirect sign-in error:', error);
      setIsGoogleSignInInProgress(false);
      throw error;
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
    loginWithGoogleRedirect,
    logout,
    isGoogleSignInInProgress,
    useRedirect
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}