/**
 * Admin Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * Dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get all collections
    const [usersSnapshot, guidesSnapshot, eventsSnapshot, bookingsSnapshot, vehiclesSnapshot, tripPlansSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('guides').get(),
      db.collection('events').get(),
      db.collection('bookings').get(),
      db.collection('vehicles').get(),
      db.collection('tripPlans').get()
    ]);

    const users = docsToArray(usersSnapshot.docs);
    const guides = docsToArray(guidesSnapshot.docs);
    const events = docsToArray(eventsSnapshot.docs);
    const bookings = docsToArray(bookingsSnapshot.docs);
    const vehicles = docsToArray(vehiclesSnapshot.docs);
    const tripPlans = docsToArray(tripPlansSnapshot.docs);

    // Calculate totals
    const totalUsers = users.length;
    const totalGuides = guides.length;
    const totalEvents = events.length;
    const totalBookings = bookings.length;
    const totalVehicles = vehicles.length;
    const totalTripPlans = tripPlans.length;

    // Calculate total revenue
    const totalRevenue = bookings
      .filter(b => b.payment?.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    // Recent users (last 5)
    const recentUsers = users
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5)
      .map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }));

    // Recent bookings (last 5) with populated user
    const recentBookingsData = bookings
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 5);

    const recentBookings = await Promise.all(
      recentBookingsData.map(async (booking) => {
        if (booking.user) {
          const userDoc = await db.collection('users').doc(booking.user).get();
          if (userDoc.exists) {
            const user = docToObject(userDoc);
            return {
              ...booking,
              user: { _id: user._id, name: user.name, email: user.email }
            };
          }
        }
        return booking;
      })
    );

    // Monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newUsers = users.filter(u => {
      const created = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return created >= currentMonth;
    }).length;

    const newBookings = bookings.filter(b => {
      const created = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return created >= currentMonth;
    }).length;

    const monthlyRevenue = bookings
      .filter(b => {
        const created = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return created >= currentMonth && b.payment?.paymentStatus === 'completed';
      })
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    res.json({
      overview: {
        totalUsers,
        totalGuides,
        totalEvents,
        totalBookings,
        totalVehicles,
        totalTripPlans,
        totalRevenue
      },
      monthly: {
        newUsers,
        newBookings,
        revenue: monthlyRevenue
      },
      recent: {
        users: recentUsers,
        bookings: recentBookings
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * Get all users
 */
router.get('/users', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    let usersSnapshot = await db.collection('users').get();
    let users = docsToArray(usersSnapshot.docs);

    // Apply filters
    if (role) {
      users = users.filter(u => u.role === role);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      users = users.filter(u => 
        searchRegex.test(u.name) || searchRegex.test(u.email)
      );
    }

    // Sort
    users.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = users.slice(skip, skip + parseInt(limit));

    // Remove passwords
    const safeUsers = paginatedUsers.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json({
      users: safeUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(users.length / parseInt(limit)),
        total: users.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user status
 */
router.put('/users/:id/status', validateObjectId, async (req, res) => {
  try {
    const { isActive } = req.body;

    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update({
      isActive,
      updatedAt: new Date()
    });

    const updatedDoc = await userRef.get();
    const user = docToObject(updatedDoc);
    const { password, ...safeUser } = user;

    res.json({
      message: 'User status updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * Delete user
 */
router.delete('/users/:id', validateObjectId, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related data
    const userId = req.params.id;
    
    // Get and delete related documents
    const [guidesSnapshot, bookingsSnapshot, vehiclesSnapshot, tripPlansSnapshot] = await Promise.all([
      db.collection('guides').where('user', '==', userId).get(),
      db.collection('bookings').where('user', '==', userId).get(),
      db.collection('vehicles').where('owner', '==', userId).get(),
      db.collection('tripPlans').where('user', '==', userId).get()
    ]);

    // Delete guides
    const guideBatch = db.batch();
    guidesSnapshot.docs.forEach(doc => guideBatch.delete(doc.ref));
    await guideBatch.commit();

    // Delete bookings
    const bookingBatch = db.batch();
    bookingsSnapshot.docs.forEach(doc => bookingBatch.delete(doc.ref));
    await bookingBatch.commit();

    // Delete vehicles
    const vehicleBatch = db.batch();
    vehiclesSnapshot.docs.forEach(doc => vehicleBatch.delete(doc.ref));
    await vehicleBatch.commit();

    // Delete trip plans
    const tripPlanBatch = db.batch();
    tripPlansSnapshot.docs.forEach(doc => tripPlanBatch.delete(doc.ref));
    await tripPlanBatch.commit();

    // Delete user
    await db.collection('users').doc(req.params.id).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * Get all guides
 */
router.get('/guides', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let guidesSnapshot = await db.collection('guides').get();
    let guides = docsToArray(guidesSnapshot.docs);

    // Apply filters
    if (status) {
      guides = guides.filter(g => (status === 'verified') === g.isVerified);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      guides = guides.filter(g => 
        searchRegex.test(g.bio || '') || 
        (g.specialties && g.specialties.some(s => searchRegex.test(s)))
      );
    }

    // Sort
    guides.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedGuides = guides.slice(skip, skip + parseInt(limit));

    // Populate user data
    const populatedGuides = await Promise.all(
      paginatedGuides.map(async (guide) => {
        if (guide.user) {
          const userDoc = await db.collection('users').doc(guide.user).get();
          if (userDoc.exists) {
            const user = docToObject(userDoc);
            guide.user = {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone
            };
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
 * Update guide verification
 */
router.put('/guides/:id/verify', validateObjectId, async (req, res) => {
  try {
    const { isVerified } = req.body;

    const guideRef = db.collection('guides').doc(req.params.id);
    const guideDoc = await guideRef.get();

    if (!guideDoc.exists) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    await guideRef.update({
      isVerified,
      updatedAt: new Date()
    });

    const updatedDoc = await guideRef.get();
    let guide = docToObject(updatedDoc);

    // Populate user
    if (guide.user) {
      const userDoc = await db.collection('users').doc(guide.user).get();
      if (userDoc.exists) {
        const user = docToObject(userDoc);
        guide.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      }
    }

    res.json({
      message: 'Guide verification status updated successfully',
      guide
    });
  } catch (error) {
    console.error('Update guide verification error:', error);
    res.status(500).json({ error: 'Failed to update guide verification' });
  }
});

/**
 * Get all events
 */
router.get('/events', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;

    let query = db.collection('events');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    let eventsSnapshot = await query.get();
    let events = docsToArray(eventsSnapshot.docs);

    // Client-side search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      events = events.filter(e => 
        searchRegex.test(e.title || '') || searchRegex.test(e.description || '')
      );
    }

    // Sort
    events.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedEvents = events.slice(skip, skip + parseInt(limit));

    res.json({
      events: paginatedEvents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(events.length / parseInt(limit)),
        total: events.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * Update event featured status
 */
router.put('/events/:id/feature', validateObjectId, async (req, res) => {
  try {
    const { isFeatured } = req.body;

    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await eventRef.update({
      isFeatured,
      updatedAt: new Date()
    });

    const updatedDoc = await eventRef.get();
    res.json({
      message: 'Event featured status updated successfully',
      event: docToObject(updatedDoc)
    });
  } catch (error) {
    console.error('Update event feature error:', error);
    res.status(500).json({ error: 'Failed to update event feature status' });
  }
});

/**
 * Get all bookings
 */
router.get('/bookings', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;

    let query = db.collection('bookings');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    let bookingsSnapshot = await query.get();
    let bookings = docsToArray(bookingsSnapshot.docs);

    // Client-side search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      bookings = bookings.filter(b => 
        searchRegex.test(b.payment?.transactionId || '')
      );
    }

    // Sort
    bookings.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBookings = bookings.slice(skip, skip + parseInt(limit));

    // Populate references
    const populatedBookings = await Promise.all(
      paginatedBookings.map(async (booking) => {
        if (booking.user) {
          const userDoc = await db.collection('users').doc(booking.user).get();
          if (userDoc.exists) {
            const user = docToObject(userDoc);
            booking.user = { _id: user._id, name: user.name, email: user.email };
          }
        }

        if (booking.guide) {
          const guideDoc = await db.collection('guides').doc(booking.guide).get();
          if (guideDoc.exists) {
            const guide = docToObject(guideDoc);
            if (guide.user) {
              const userDoc = await db.collection('users').doc(guide.user).get();
              if (userDoc.exists) {
                const user = docToObject(userDoc);
                guide.user = { _id: user._id, name: user.name, email: user.email };
              }
            }
            booking.guide = guide;
          }
        }

        if (booking.event) {
          const eventDoc = await db.collection('events').doc(booking.event).get();
          if (eventDoc.exists) {
            booking.event = { _id: eventDoc.id, title: docToObject(eventDoc).title };
          }
        }

        if (booking.vehicle) {
          const vehicleDoc = await db.collection('vehicles').doc(booking.vehicle).get();
          if (vehicleDoc.exists) {
            const vehicle = docToObject(vehicleDoc);
            booking.vehicle = { _id: vehicle._id, make: vehicle.make, model: vehicle.model };
          }
        }

        return booking;
      })
    );

    res.json({
      bookings: populatedBookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(bookings.length / parseInt(limit)),
        total: bookings.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * Get settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settingsDoc = await db.collection('settings').doc('main').get();
    const settings = settingsDoc.exists 
      ? docToObject(settingsDoc)
      : {
          siteName: 'Dishaara',
          maintenanceMode: false,
          registrationEnabled: true,
          guideVerificationRequired: true,
          maxFileSize: '10MB',
          supportedImageTypes: ['jpg', 'jpeg', 'png', 'gif'],
          contactEmail: 'admin@dishaara.com',
          supportPhone: '+91-9876543210'
        };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * Update settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { maintenanceMode, registrationEnabled, guideVerificationRequired } = req.body;

    const settings = {
      maintenanceMode: maintenanceMode || false,
      registrationEnabled: registrationEnabled !== false,
      guideVerificationRequired: guideVerificationRequired !== false,
      updatedAt: new Date()
    };

    await db.collection('settings').doc('main').set(settings, { merge: true });

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
