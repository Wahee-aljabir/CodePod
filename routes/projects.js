const express = require('express');
const { getFirestore } = require('../config/firebase');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
const { Project } = require('../models/Project');
const router = express.Router();

// @route   GET /api/projects
// @desc    Get all public projects with pagination and filtering
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const {
      page = 1,
      limit = 12,
      search = '',
      tags = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db.collection('projects');

    // Filter by public projects only (unless viewing own projects)
    if (!userId || userId !== req.user?.uid) {
      query = query.where('isPublic', '==', true);
    }

    // Filter by user
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.where('tags', 'array-contains-any', tagArray);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    query = query.offset(offset).limit(limitNum);
    const snapshot = await query.get();

    const projects = [];
    snapshot.forEach(doc => {
      const project = Project.fromFirestore(doc);
      
      // Apply text search filter (client-side for simplicity)
      if (search) {
        const searchLower = search.toLowerCase();
        const titleMatch = project.title.toLowerCase().includes(searchLower);
        const descMatch = project.description.toLowerCase().includes(searchLower);
        const tagMatch = project.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (titleMatch || descMatch || tagMatch) {
          projects.push(project.toPublic());
        }
      } else {
        projects.push(project.toPublic());
      }
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

// @route   GET /api/projects/:id
// @desc    Get single project by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const projectDoc = await db.collection('projects').doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = Project.fromFirestore(projectDoc);

    // Check if project is public or user owns it
    if (!project.isPublic && project.userId !== req.user?.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This project is private.'
      });
    }

    // Increment view count (only if not the owner)
    if (project.userId !== req.user?.uid) {
      await db.collection('projects').doc(req.params.id).update({
        views: (project.views || 0) + 1
      });
      project.views = (project.views || 0) + 1;
    }

    res.json({
      success: true,
      data: project.toPublic()
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = Project.validate({ ...req.body, userId: req.user.uid });
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    const db = getFirestore();
    
    // Create new project
    const project = new Project(value);
    const docRef = await db.collection('projects').add(project.toFirestore());
    
    // Update user's project count
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      projectsCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Get the created project
    const createdDoc = await docRef.get();
    const createdProject = Project.fromFirestore(createdDoc);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: createdProject.toPublic()
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const projectDoc = await db.collection('projects').doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const existingProject = Project.fromFirestore(projectDoc);

    // Check ownership
    if (existingProject.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own projects.'
      });
    }

    // Validate input
    const { error, value } = Project.validate({ ...req.body, userId: req.user.uid }, true);
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    // Update project
    const updateData = {
      ...value,
      updatedAt: new Date()
    };
    
    await db.collection('projects').doc(req.params.id).update(updateData);

    // Get updated project
    const updatedDoc = await db.collection('projects').doc(req.params.id).get();
    const updatedProject = Project.fromFirestore(updatedDoc);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject.toPublic()
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const projectDoc = await db.collection('projects').doc(req.params.id).get();

    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = Project.fromFirestore(projectDoc);

    // Check ownership
    if (project.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own projects.'
      });
    }

    // Delete project
    await db.collection('projects').doc(req.params.id).delete();

    // Update user's project count
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      projectsCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects/:id/fork
// @desc    Fork a project
// @access  Private
router.post('/:id/fork', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const originalDoc = await db.collection('projects').doc(req.params.id).get();

    if (!originalDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const originalProject = Project.fromFirestore(originalDoc);

    // Check if project is public or user owns it
    if (!originalProject.isPublic && originalProject.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Cannot fork private project'
      });
    }

    // Create forked project
    const forkedProject = new Project({
      ...originalProject.toPublic(),
      title: `${originalProject.title} (Fork)`,
      userId: req.user.uid,
      forkFrom: req.params.id,
      views: 0,
      likes: 0,
      forks: 0
    });

    // Save forked project
    const docRef = await db.collection('projects').add(forkedProject.toFirestore());
    
    // Increment fork count on original project
    await db.collection('projects').doc(req.params.id).update({
      forks: (originalProject.forks || 0) + 1
    });

    // Update user's project count
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.update({
      projectsCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Get the created fork
    const createdDoc = await docRef.get();
    const createdFork = Project.fromFirestore(createdDoc);

    res.status(201).json({
      success: true,
      message: 'Project forked successfully',
      data: createdFork.toPublic()
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects/:id/like
// @desc    Like/unlike a project
// @access  Private
router.post('/:id/like', verifyFirebaseToken, async (req, res, next) => {
  try {
    const db = getFirestore();
    const projectRef = db.collection('projects').doc(req.params.id);
    const likeRef = db.collection('likes').doc(`${req.user.uid}_${req.params.id}`);

    const [projectDoc, likeDoc] = await Promise.all([
      projectRef.get(),
      likeRef.get()
    ]);

    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = Project.fromFirestore(projectDoc);
    const isLiked = likeDoc.exists;

    if (isLiked) {
      // Unlike: remove like and decrement count
      await Promise.all([
        likeRef.delete(),
        projectRef.update({
          likes: Math.max((project.likes || 0) - 1, 0)
        })
      ]);
    } else {
      // Like: add like and increment count
      await Promise.all([
        likeRef.set({
          userId: req.user.uid,
          projectId: req.params.id,
          createdAt: new Date()
        }),
        projectRef.update({
          likes: (project.likes || 0) + 1
        })
      ]);
    }

    res.json({
      success: true,
      message: isLiked ? 'Project unliked' : 'Project liked',
      data: {
        liked: !isLiked,
        likes: isLiked ? Math.max((project.likes || 0) - 1, 0) : (project.likes || 0) + 1
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;