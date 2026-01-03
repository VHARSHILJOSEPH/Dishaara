/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin SDK using service account credentials
 * Provides Firestore and Auth instances for backend operations
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Use service account credentials from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle private key with proper newline replacement
      // Try multiple formats: \\n, actual newlines, or no replacement needed
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ?.replace(/\\n/g, '\n')
        ?.replace(/"/g, '')  // Remove surrounding quotes if present
        .trim(),
    };

    // Validate required environment variables
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.warn('⚠️  WARNING: Firebase environment variables not set!');
      console.warn('   Please create a .env file in the server/ directory with:');
      console.warn('   - FIREBASE_PROJECT_ID');
      console.warn('   - FIREBASE_CLIENT_EMAIL');
      console.warn('   - FIREBASE_PRIVATE_KEY');
      console.warn('   See server/env.example for reference.');
      console.warn('');
      console.warn('   The server will start but Firebase features will not work until configured.');
      
      // Use default credentials (for local development only - won't work without proper setup)
      // This allows the server to start but Firebase operations will fail
      admin.initializeApp({
        projectId: 'default-project',
      });
      console.warn('⚠️  Firebase initialized with default config (operations will fail until properly configured)');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error.message);
    // Don't throw - allow server to start but log the error
    console.error('   Server will start but Firebase features will not work.');
    try {
      admin.initializeApp({ projectId: 'default-project' });
    } catch (e) {
      // Ignore if already initialized
    }
  }
}

// Export Firestore and Auth instances
export const db = admin.firestore();
export const auth = admin.auth();

// Export admin instance for advanced operations if needed
export default admin;

/**
 * Helper function to convert Firestore timestamp to JavaScript Date
 */
export const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

/**
 * Helper function to convert Firestore document to plain object with ID
 */
export const docToObject = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    _id: doc.id,
    id: doc.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

/**
 * Helper function to convert array of Firestore documents
 */
export const docsToArray = (docs) => {
  return docs.map((doc) => docToObject(doc));
};

