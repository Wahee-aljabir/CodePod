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
  serverTimestamp // Add this import
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

export const saveProject = async (userId, projectData) => {
  try {
    const projectId = projectData.id || uuidv4();
    const projectRef = doc(db, 'projects', projectId);
    
    const project = {
      ...projectData,
      id: projectId,
      userId,
      updatedAt: new Date().toISOString(),
      createdAt: projectData.createdAt || new Date().toISOString()
    };
    
    await setDoc(projectRef, project);
    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const getUserProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

export const getProject = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (projectSnap.exists()) {
      return { id: projectSnap.id, ...projectSnap.data() };
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const updateProject = async (userId, project) => {
  try {
    const projectRef = doc(db, 'projects', project.id || uuidv4());
    await setDoc(projectRef, {
      ...project,
      userId,
      updatedAt: serverTimestamp(),
      createdAt: project.createdAt || serverTimestamp(),
      isPublic: project.isPublic || false, // This line was added
    }, { merge: true });
    return projectRef.id;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};