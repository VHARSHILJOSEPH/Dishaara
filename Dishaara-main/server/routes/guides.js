/**
 * Guides Routes - Firestore Implementation
 * Handles guide profile management and queries
 */

import express from 'express';
import { db, docToObject, docsToArray, toDate } from '../firebase/firebase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateGuideProfile, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get all guides with filters
 */
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      specialties,
      minRating,
      maxPrice,
      isAvailable = true
    } = req.query;

    let query = db.collection('guides')
      .where('isActive', '==', true)
      .where('isVerified', '==', true);

    // Apply filters
    if (specialties) {
      const specialtyList = specialties.split(',');
      // Firestore doesn't support $in directly with where, we'll filter client-side
      // For better performance, you might want to create a specialties array field
    }

    // Get all matching guides (we'll filter client-side for complex queries)
    let guidesSnapshot = await query.get();
    let guides = docsToArray(guidesSnapshot.docs);

    // Client-side filtering for complex queries
    if (city) {
      const cityRegex = new RegExp(city, 'i');
      guides = guides.filter(g => g.location?.city && cityRegex.test(g.location.city));
    }

    if (specialties) {
      const specialtyList = specialties.split(',');
      guides = guides.filter(g => 
        g.specialties && specialtyList.some(s => g.specialties.includes(s))
      );
    }

    if (minRating) {
      guides = guides.filter(g => 
        g.ratings?.average && g.ratings.average >= parseFloat(minRating)
      );
    }

    if (maxPrice) {
      guides = guides.filter(g => 
        g.pricing?.hourlyRate && g.pricing.hourlyRate <= parseFloat(maxPrice)
      );
    }

    // Sort by rating and date
    guides.sort((a, b) => {
      const ratingA = a.ratings?.average || 0;
      const ratingB = b.ratings?.average || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedGuides = guides.slice(skip, skip + parseInt(limit));

    // Populate user data
    const populatedGuides = await Promise.all(
      paginatedGuides.map(async (guide) => {
        if (guide.user) {
          try {
            const userDoc = await db.collection('users').doc(guide.user).get();
            if (userDoc.exists) {
              const user = docToObject(userDoc);
              guide.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
              };
            }
          } catch (error) {
            console.error('Error populating user:', error);
          }
        }
        return guide;
      })
    );

    res.json({
      guides: populatedGuides,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(guides.length / parseInt(limit)),
        total: guides.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

/**
 * Get guide by ID
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const guideDoc = await db.collection('guides').doc(req.params.id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    let guide = docToObject(guideDoc);

    // Populate user data
    if (guide.user) {
      try {
        const userDoc = await db.collection('users').doc(guide.user).get();
        if (userDoc.exists) {
          const user = docToObject(userDoc);
          guide.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone
          };
        }
      } catch (error) {
        console.error('Error populating user:', error);
      }
    }

    res.json(guide);
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

/**
 * Create guide profile
 */
router.post('/', authenticateToken, requireRole(['guide']), validateGuideProfile, async (req, res) => {
  try {
    const guideData = req.body;
    guideData.user = req.user._id;

    // Check if guide profile already exists
    const existingGuidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (!existingGuidesSnapshot.empty) {
      return res.status(400).json({ error: 'Guide profile already exists' });
    }

    // Create guide document
    const guideRef = db.collection('guides').doc();
    const newGuideData = {
      ...guideData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await guideRef.set(newGuideData);

    // Get created guide
    const guideDoc = await guideRef.get();
    let guide = docToObject(guideDoc);

    // Populate user data
    if (guide.user) {
      const userDoc = await db.collection('users').doc(guide.user).get();
      if (userDoc.exists) {
        const user = docToObject(userDoc);
        guide.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
      }
    }

    res.status(201).json({
      message: 'Guide profile created successfully',
      guide
    });
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({ error: 'Failed to create guide profile' });
  }
});

/**
 * Update guide profile
 */
router.put('/:id', authenticateToken, validateObjectId, validateGuideProfile, async (req, res) => {
  try {
    const guideDoc = await db.collection('guides').doc(req.params.id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const guide = docToObject(guideDoc);

    // Check if user owns this guide profile or is admin
    if (guide.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this guide profile' });
    }

    // Update guide
    await db.collection('guides').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });

    // Get updated guide
    const updatedGuideDoc = await db.collection('guides').doc(req.params.id).get();
    let updatedGuide = docToObject(updatedGuideDoc);

    // Populate user data
    if (updatedGuide.user) {
      const userDoc = await db.collection('users').doc(updatedGuide.user).get();
      if (userDoc.exists) {
        const user = docToObject(userDoc);
        updatedGuide.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
      }
    }

    res.json({
      message: 'Guide profile updated successfully',
      guide: updatedGuide
    });
  } catch (error) {
    console.error('Update guide error:', error);
    res.status(500).json({ error: 'Failed to update guide profile' });
  }
});

/**
 * Delete guide profile
 */
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const guideDoc = await db.collection('guides').doc(req.params.id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const guide = docToObject(guideDoc);

    // Check if user owns this guide profile or is admin
    if (guide.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this guide profile' });
    }

    await db.collection('guides').doc(req.params.id).delete();

    res.json({ message: 'Guide profile deleted successfully' });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({ error: 'Failed to delete guide profile' });
  }
});

/**
 * Search guides by location
 * Note: Firestore doesn't have geospatial queries like MongoDB's $near
 * This is a simplified version. For production, consider using GeoFirestore or similar
 */
router.get('/search/location', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    // Get all guides (simplified - for production use GeoFirestore)
    const guidesSnapshot = await db.collection('guides')
      .where('isActive', '==', true)
      .where('isVerified', '==', true)
      .get();

    let guides = docsToArray(guidesSnapshot.docs);

    // Filter by distance (Haversine formula)
    guides = guides.filter(guide => {
      if (!guide.location?.coordinates?.lat || !guide.location?.coordinates?.lng) {
        return false;
      }

      const guideLat = guide.location.coordinates.lat;
      const guideLng = guide.location.coordinates.lng;

      // Haversine formula to calculate distance
      const R = 6371; // Earth's radius in km
      const dLat = (guideLat - centerLat) * Math.PI / 180;
      const dLng = (guideLng - centerLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(centerLat * Math.PI / 180) * Math.cos(guideLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= parseFloat(radius);
    });

    // Limit results
    guides = guides.slice(0, 20);

    // Populate user data
    const populatedGuides = await Promise.all(
      guides.map(async (guide) => {
        if (guide.user) {
          try {
            const userDoc = await db.collection('users').doc(guide.user).get();
            if (userDoc.exists) {
              const user = docToObject(userDoc);
              guide.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
              };
            }
          } catch (error) {
            console.error('Error populating user:', error);
          }
        }
        return guide;
      })
    );

    res.json({ guides: populatedGuides });
  } catch (error) {
    console.error('Search guides by location error:', error);
    res.status(500).json({ error: 'Failed to search guides' });
  }
});

/**
 * Get guide availability
 */
router.get('/:id/availability', validateObjectId, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const guideDoc = await db.collection('guides').doc(req.params.id).get();

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const guide = docToObject(guideDoc);

    // Check if guide is available on the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const schedule = guide.availability?.schedule?.find(s => s.day === dayOfWeek);

    if (!schedule || !schedule.isAvailable) {
      return res.json({ available: false, message: 'Guide not available on this date' });
    }

    res.json({
      available: true,
      schedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }
    });
  } catch (error) {
    console.error('Get guide availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
