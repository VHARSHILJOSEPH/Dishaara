/**
 * Authentication Routes - Firebase Auth + Firestore Implementation
 * Uses Firebase Authentication for user authentication
 * Uses Firestore for user profile storage
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, docToObject, auth } from '../firebase/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Helper function to generate JWT token (for backward compatibility)
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Register - Creates user in Firestore using Firebase Auth UID
 * Expects Firebase ID token in Authorization header
 * This is called after user is created in Firebase Auth on the frontend
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, role = 'user' } = req.body;

    // Get Firebase ID token from Authorization header
    const authHeader = req.headers['authorization'];
    const idToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!idToken) {
      return res.status(401).json({ error: 'Firebase ID token required' });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }

    const firebaseUid = decodedToken.uid;
    const firebaseEmail = decodedToken.email || email;

    // Check if user already exists in Firestore
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    
    if (userDoc.exists) {
      // User already exists, return existing user
      const user = docToObject(userDoc);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        message: 'User already exists',
        user: userWithoutPassword
      });
    }

    // Create user document in Firestore using Firebase UID
    const userData = {
      _id: firebaseUid, // Use Firebase UID as document ID
      name: name || firebaseEmail.split('@')[0],
      email: firebaseEmail.toLowerCase(),
      phone: phone || null,
      role,
      avatar: null,
      isVerified: decodedToken.email_verified || false,
      preferences: {
        travelStyle: 'cultural',
        budget: 'mid'
      },
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(firebaseUid).set(userData);

    // Get created user
    const createdUserDoc = await db.collection('users').doc(firebaseUid).get();
    const user = docToObject(createdUserDoc);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login - Legacy endpoint for backward compatibility
 * With Firebase Auth, login happens on the frontend
 * This endpoint verifies Firebase ID token and returns user data
 */
router.post('/login', async (req, res) => {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = req.headers['authorization'];
    const idToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!idToken) {
      // Fallback to email/password for backward compatibility
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(401).json({ error: 'Firebase ID token or email/password required' });
      }

      // Legacy email/password login (for backward compatibility)
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const userDoc = usersSnapshot.docs[0];
      const user = docToObject(userDoc);

      // Check password (compare with hashed password in Firestore)
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is active
      if (user.isActive === false) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Update last login
      await db.collection('users').doc(user._id).update({
        lastLogin: new Date(),
        updatedAt: new Date()
      });

      // Generate JWT token
      const token = generateToken(user._id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token // JWT token for frontend
      });
    }

    // Firebase ID token login (preferred method)
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }

    const firebaseUid = decodedToken.uid;

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const user = docToObject(userDoc);

    // Check if account is active
    if (user.isActive === false) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await db.collection('users').doc(firebaseUid).update({
      lastLogin: new Date(),
      updatedAt: new Date()
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, preferences, location, emergencyContact } = req.body;
    
    const userRef = db.collection('users').doc(req.user._id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update object
    const updates = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (preferences) {
      const currentPrefs = userDoc.data().preferences || {};
      updates.preferences = { ...currentPrefs, ...preferences };
    }
    if (location) {
      const currentLocation = userDoc.data().location || {};
      updates.location = { ...currentLocation, ...location };
    }
    if (emergencyContact) {
      const currentContact = userDoc.data().emergencyContact || {};
      updates.emergencyContact = { ...currentContact, ...emergencyContact };
    }

    // Update Firestore
    await userRef.update(updates);

    // Get updated user
    const updatedUserDoc = await userRef.get();
    const updatedUser = docToObject(updatedUserDoc);
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Change password
 * Note: With Firebase Auth, password changes should be handled on the frontend
 * using Firebase's updatePassword() method. This endpoint is kept for backward compatibility.
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userDoc = await db.collection('users').doc(req.user._id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();

    // If user has a password stored (legacy users), verify it
    if (user.password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // For Firebase Auth users, password is managed by Firebase
    // We just update the timestamp to indicate password was changed
    await db.collection('users').doc(req.user._id).update({
      updatedAt: new Date()
    });

    res.json({ 
      message: 'Password change request processed. Please use Firebase Auth to change your password on the frontend.' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * Logout - Client-side token removal
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // JWT tokens are stateless, so we just return success
    // Client should remove token from localStorage
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
