/**
 * Authentication Middleware
 * Supports both JWT tokens (for compatibility) and Firebase ID tokens
 * Verifies tokens and attaches user data to request
 */

import jwt from 'jsonwebtoken';
import { auth, db, docToObject } from '../firebase/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT or Firebase ID token and attach user to request
 * Expects Authorization header: "Bearer <token>"
 * Supports both JWT tokens and Firebase ID tokens
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    let userId = null;
    let isFirebaseToken = false;

    // Try to verify as JWT token first (most common)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (jwtError) {
      // If JWT verification fails, try Firebase ID token
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
        isFirebaseToken = true;
      } catch (firebaseError) {
        // Both failed
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired' });
        }
        if (jwtError.name === 'JsonWebTokenError') {
          // Try Firebase error messages
          if (firebaseError.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expired' });
          }
          if (firebaseError.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Invalid token format' });
          }
          return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Authentication error:', { 
          jwtError: jwtError.message, 
          firebaseError: firebaseError.message || firebaseError.code 
        });
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = docToObject(userDoc);

    // Check if account is active
    if (user.isActive === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Attach user to request object
    req.user = user;
    req.uid = userId; // For consistency
    req.userId = userId; // Alternative access
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require specific user roles
 * Must be used after authenticateToken middleware
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Helper function to generate JWT token (for backwards compatibility)
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
