const express = require('express');
const jwt = require('jsonwebtoken');
const { getAuth, getFirestore } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });

    // Create user profile in Firestore
    const db = getFirestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectsCount: 0,
      isActive: true
    });

    // Generate custom token
    const customToken = await getAuth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user (verify ID token)
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify the ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // Get user profile from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    let userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };

    // If user profile doesn't exist in Firestore, create it
    if (!userDoc.exists) {
      const newUserData = {
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectsCount: 0,
        isActive: true
      };
      
      await db.collection('users').doc(decodedToken.uid).set(newUserData);
      userData = { ...userData, ...newUserData };
    } else {
      userData = { ...userData, ...userDoc.data() };
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: idToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh user token
// @access  Private
router.post('/refresh', verifyFirebaseToken, async (req, res, next) => {
  try {
    // Generate new custom token
    const customToken = await getAuth().createCustomToken(req.user.uid);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        customToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.name,
        photoURL: req.user.picture,
        ...userData
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const batch = db.batch();

    // Delete user's projects
    const projectsSnapshot = await db.collection('projects')
      .where('userId', '==', req.user.uid)
      .get();
    
    projectsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user profile
    batch.delete(db.collection('users').doc(req.user.uid));
    
    // Commit batch
    await batch.commit();

    // Delete user from Firebase Auth
    await getAuth().deleteUser(req.user.uid);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;