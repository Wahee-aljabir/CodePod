import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Enhanced error handling
const handleFirestoreError = (error, operation) => {
  console.error(`Firestore ${operation} error:`, error);
  
  if (error.code === 'permission-denied') {
    throw new Error('Permission denied. Please verify your authentication status and review the Firestore security rules.');
  } else if (error.code === 'unavailable') {
    throw new Error('Firestore is currently unavailable. Please try again later.');
  } else if (error.code === 'invalid-argument') {
    throw new Error('Invalid data provided. Please check your input.');
  } else if (error.code === 'unauthenticated') {
    throw new Error('User not authenticated. Please log in and try again.');
  }
  
  throw error;
};

export const saveProject = async (userId, projectData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required. Please ensure you are logged in.');
    }
    
    if (!projectData) {
      throw new Error('Project data is required.');
    }
    
    console.log('Saving project for user:', userId);
    
    const projectId = projectData.id || uuidv4();
    const projectRef = doc(db, 'projects', projectId);
    
    // Access control: Check ownership for existing projects
    if (projectData.id) {
      try {
        const existingProject = await getDoc(projectRef);
        if (existingProject.exists()) {
          const existingData = existingProject.data();
          if (existingData.userId && existingData.userId !== userId) {
            throw new Error('Permission denied: You can only update projects that you own.');
          }
        }
      } catch (error) {
        if (error.message.includes('Permission denied')) {
          throw error;
        }
        // If project doesn't exist, continue with creation
      }
    }
    
    const project = {
      ...projectData,
      id: projectId,
      userId: userId,
      updatedAt: serverTimestamp(),
      createdAt: projectData.createdAt || serverTimestamp(),
      isPublic: projectData.isPublic || false
    };
    
    await setDoc(projectRef, project, { merge: true });
    
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString()
    };
  } catch (error) {
    handleFirestoreError(error, 'save project');
  }
};

export const getUserProjects = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, 'get user projects');
  }
};

// New function to get public projects for community section
// Replace the getPublicProjects function (around line 85)
export const getPublicProjects = async (limitCount = 20) => {
  try {
    const projectsRef = collection(db, 'projects');
    // Simplified query - remove orderBy to avoid index requirement
    const q = query(
      projectsRef,
      where('isPublic', '==', true),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in JavaScript instead of Firestore
    return projects.sort((a, b) => {
      const aTime = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt).getTime();
      return bTime - aTime; // Descending order
    });
  } catch (error) {
    console.error('Error getting public projects:', error);
    return [];
  }
};

export const getProject = async (projectId) => {
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      return { id: projectSnap.id, ...projectSnap.data() };
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    handleFirestoreError(error, 'get project');
  }
};

export const deleteProject = async (projectId, userId) => {
  try {
    if (!projectId || !userId) {
      throw new Error('Project ID and User ID are required');
    }
    
    const project = await getProject(projectId);
    if (project.userId !== userId) {
      throw new Error('Permission denied: You can only delete your own projects');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, 'delete project');
  }
};

// Add this function to handle project updates
export const updateProjectVisibility = async (projectId, userId, isPublic) => {
  try {
    if (!projectId || !userId) {
      throw new Error('Project ID and User ID are required');
    }
    
    const project = await getProject(projectId);
    if (project.userId !== userId) {
      throw new Error('Permission denied: You can only update your own projects');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, { 
      isPublic: isPublic,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { ...project, isPublic, updatedAt: new Date().toISOString() };
  } catch (error) {
    handleFirestoreError(error, 'update project visibility');
  }
};