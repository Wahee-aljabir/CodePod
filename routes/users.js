const express = require('express');
const { getFirestore } = require('../config/firebase');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    // Return public profile only
    res.json({
      success: true,
      data: {
        uid: req.params.id,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        projectsCount: userData.projectsCount || 0,
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { displayName, bio, website, location } = req.body;
    
    const db = getFirestore();
    const updateData = {
      updatedAt: new Date()
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;

    await db.collection('users').doc(req.user.uid).update(updateData);

    // Get updated profile
    const updatedDoc = await db.collection('users').doc(req.user.uid).get();
    const updatedData = updatedDoc.data();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        uid: req.user.uid,
        email: req.user.email,
        ...updatedData
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id/projects
// @desc    Get user's public projects
// @access  Public
router.get('/:id/projects', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const db = getFirestore();
    let query = db.collection('projects')
      .where('userId', '==', req.params.id);

    // Show only public projects unless viewing own profile
    if (req.params.id !== req.user?.uid) {
      query = query.where('isPublic', '==', true);
    }

    query = query.orderBy(sortBy, sortOrder);

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    query = query.offset(offset).limit(limitNum);
    const snapshot = await query.get();

    const projects = [];
    snapshot.forEach(doc => {
      const project = Project.fromFirestore(doc);
      projects.push(project.toPublic());
    });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;