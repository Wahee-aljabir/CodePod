const admin = require('firebase-admin');

// Firebase Admin SDK configuration
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

let db = null;

const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
};

const getAuth = () => {
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};