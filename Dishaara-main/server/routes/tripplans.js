/**
 * Trip Plans Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTripPlan, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get user's trip plans
 */
router.get('/my-plans', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = db.collection('tripPlans').where('user', '==', req.user._id);

    if (status) {
      query = query.where('status', '==', status);
    }

    const tripPlansSnapshot = await query.get();
    let tripPlans = docsToArray(tripPlansSnapshot.docs);

    // Sort by createdAt
    tripPlans.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPlans = tripPlans.slice(skip, skip + parseInt(limit));

    res.json({
      tripPlans: paginatedPlans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(tripPlans.length / parseInt(limit)),
        total: tripPlans.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user trip plans error:', error);
    res.status(500).json({ error: 'Failed to fetch trip plans' });
  }
});

/**
 * Get public trip plans
 */
router.get('/public', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, destination, theme } = req.query;

    let query = db.collection('tripPlans')
      .where('isPublic', '==', true);

    let tripPlansSnapshot = await query.get();
    let tripPlans = docsToArray(tripPlansSnapshot.docs);

    // Filter by status
    tripPlans = tripPlans.filter(plan => ['planned', 'completed'].includes(plan.status));

    // Client-side filtering
    if (destination) {
      const destRegex = new RegExp(destination, 'i');
      tripPlans = tripPlans.filter(plan => 
        plan.destination?.city && destRegex.test(plan.destination.city)
      );
    }

    if (theme) {
      tripPlans = tripPlans.filter(plan => plan.preferences?.theme === theme);
    }

    // Sort
    tripPlans.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPlans = tripPlans.slice(skip, skip + parseInt(limit));

    // Populate user data
    const populatedPlans = await Promise.all(
      paginatedPlans.map(async (plan) => {
        if (plan.user) {
          try {
            const userDoc = await db.collection('users').doc(plan.user).get();
            if (userDoc.exists) {
              const user = docToObject(userDoc);
              plan.user = {
                _id: user._id,
                name: user.name,
                avatar: user.avatar
              };
            }
          } catch (error) {
            console.error('Error populating user:', error);
          }
        }
        return plan;
      })
    );

    res.json({
      tripPlans: populatedPlans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(tripPlans.length / parseInt(limit)),
        total: tripPlans.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get public trip plans error:', error);
    res.status(500).json({ error: 'Failed to fetch public trip plans' });
  }
});

/**
 * Get trip plan by ID
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const tripPlanDoc = await db.collection('tripPlans').doc(req.params.id).get();

    if (!tripPlanDoc.exists) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    let tripPlan = docToObject(tripPlanDoc);

    // Check authorization
    if (!tripPlan.isPublic && tripPlan.user !== req.user?._id) {
      return res.status(403).json({ error: 'Not authorized to view this trip plan' });
    }

    // Populate user
    if (tripPlan.user) {
      const userDoc = await db.collection('users').doc(tripPlan.user).get();
      if (userDoc.exists) {
        const user = docToObject(userDoc);
        tripPlan.user = {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        };
      }
    }

    res.json(tripPlan);
  } catch (error) {
    console.error('Get trip plan error:', error);
    res.status(500).json({ error: 'Failed to fetch trip plan' });
  }
});

/**
 * Create trip plan
 */
router.post('/', authenticateToken, validateTripPlan, async (req, res) => {
  try {
    const tripPlanData = {
      ...req.body,
      user: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tripPlanRef = db.collection('tripPlans').doc();
    await tripPlanRef.set(tripPlanData);

    const tripPlanDoc = await tripPlanRef.get();
    res.status(201).json({
      message: 'Trip plan created successfully',
      tripPlan: docToObject(tripPlanDoc)
    });
  } catch (error) {
    console.error('Create trip plan error:', error);
    res.status(500).json({ error: 'Failed to create trip plan' });
  }
});

/**
 * Update trip plan
 */
router.put('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const tripPlanDoc = await db.collection('tripPlans').doc(req.params.id).get();

    if (!tripPlanDoc.exists) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    const tripPlan = docToObject(tripPlanDoc);

    // Check authorization
    if (tripPlan.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to update this trip plan' });
    }

    await db.collection('tripPlans').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });

    const updatedDoc = await db.collection('tripPlans').doc(req.params.id).get();
    res.json({
      message: 'Trip plan updated successfully',
      tripPlan: docToObject(updatedDoc)
    });
  } catch (error) {
    console.error('Update trip plan error:', error);
    res.status(500).json({ error: 'Failed to update trip plan' });
  }
});

/**
 * Delete trip plan
 */
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const tripPlanDoc = await db.collection('tripPlans').doc(req.params.id).get();

    if (!tripPlanDoc.exists) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    const tripPlan = docToObject(tripPlanDoc);

    // Check authorization
    if (tripPlan.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to delete this trip plan' });
    }

    await db.collection('tripPlans').doc(req.params.id).delete();
    res.json({ message: 'Trip plan deleted successfully' });
  } catch (error) {
    console.error('Delete trip plan error:', error);
    res.status(500).json({ error: 'Failed to delete trip plan' });
  }
});

/**
 * Duplicate trip plan
 */
router.post('/:id/duplicate', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const originalDoc = await db.collection('tripPlans').doc(req.params.id).get();

    if (!originalDoc.exists) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    const original = docToObject(originalDoc);

    // Check authorization
    if (!original.isPublic && original.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to duplicate this trip plan' });
    }

    // Create duplicate
    const duplicateData = {
      ...original,
      _id: undefined,
      id: undefined,
      user: req.user._id,
      title: `${original.title} (Copy)`,
      status: 'draft',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const duplicateRef = db.collection('tripPlans').doc();
    await duplicateRef.set(duplicateData);

    const duplicateDoc = await duplicateRef.get();
    res.status(201).json({
      message: 'Trip plan duplicated successfully',
      tripPlan: docToObject(duplicateDoc)
    });
  } catch (error) {
    console.error('Duplicate trip plan error:', error);
    res.status(500).json({ error: 'Failed to duplicate trip plan' });
  }
});

/**
 * Get trip plan statistics
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const tripPlansSnapshot = await db.collection('tripPlans')
      .where('user', '==', req.user._id)
      .get();

    const tripPlans = docsToArray(tripPlansSnapshot.docs);

    // Calculate stats manually
    const totalPlans = tripPlans.length;
    const publicPlans = tripPlans.filter(p => p.isPublic).length;
    const aiGeneratedPlans = tripPlans.filter(p => p.aiGenerated).length;

    // Group by status
    const statusBreakdown = {};
    tripPlans.forEach(plan => {
      const status = plan.status || 'draft';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Convert to array format
    const statusBreakdownArray = Object.entries(statusBreakdown).map(([_id, count]) => ({
      _id,
      count
    }));

    res.json({
      totalPlans,
      publicPlans,
      aiGeneratedPlans,
      statusBreakdown: statusBreakdownArray
    });
  } catch (error) {
    console.error('Get trip plan stats error:', error);
    res.status(500).json({ error: 'Failed to fetch trip plan statistics' });
  }
});

/**
 * Search trip plans
 */
router.get('/search/query', async (req, res) => {
  try {
    const { q, destination, theme, budget, page = 1, limit = 10 } = req.query;

    let query = db.collection('tripPlans')
      .where('isPublic', '==', true);

    let tripPlansSnapshot = await query.get();
    let tripPlans = docsToArray(tripPlansSnapshot.docs);

    // Filter by status
    tripPlans = tripPlans.filter(plan => ['planned', 'completed'].includes(plan.status));

    // Apply filters
    if (q) {
      const queryRegex = new RegExp(q, 'i');
      tripPlans = tripPlans.filter(plan =>
        queryRegex.test(plan.title) ||
        (plan.destination?.city && queryRegex.test(plan.destination.city)) ||
        (plan.tags && plan.tags.some(tag => queryRegex.test(tag)))
      );
    }

    if (destination) {
      const destRegex = new RegExp(destination, 'i');
      tripPlans = tripPlans.filter(plan =>
        plan.destination?.city && destRegex.test(plan.destination.city)
      );
    }

    if (theme) {
      tripPlans = tripPlans.filter(plan => plan.preferences?.theme === theme);
    }

    if (budget) {
      tripPlans = tripPlans.filter(plan => plan.preferences?.budget === budget);
    }

    // Sort
    tripPlans.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPlans = tripPlans.slice(skip, skip + parseInt(limit));

    // Populate user data
    const populatedPlans = await Promise.all(
      paginatedPlans.map(async (plan) => {
        if (plan.user) {
          try {
            const userDoc = await db.collection('users').doc(plan.user).get();
            if (userDoc.exists) {
              const user = docToObject(userDoc);
              plan.user = {
                _id: user._id,
                name: user.name,
                avatar: user.avatar
              };
            }
          } catch (error) {
            console.error('Error populating user:', error);
          }
        }
        return plan;
      })
    );

    res.json({
      tripPlans: populatedPlans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(tripPlans.length / parseInt(limit)),
        total: tripPlans.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search trip plans error:', error);
    res.status(500).json({ error: 'Failed to search trip plans' });
  }
});

export default router;
