/**
 * Guide Dashboard Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['guide']));

/**
 * Get guide dashboard stats
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guide = docToObject(guidesSnapshot.docs[0]);
    const guideId = guide._id;

    // Get all bookings for this guide
    const bookingsSnapshot = await db.collection('bookings')
      .where('guide', '==', guideId)
      .get();

    const bookings = docsToArray(bookingsSnapshot.docs);

    // Calculate stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;

    // Calculate total earnings
    const totalEarnings = bookings
      .filter(b => b.payment?.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    // Calculate monthly earnings
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = bookings
      .filter(b => {
        const created = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return created >= currentMonth && b.payment?.paymentStatus === 'completed';
      })
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    // Get recent bookings
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
              user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
              }
            };
          }
        }
        return booking;
      })
    );

    res.json({
      overview: {
        totalBookings,
        completedBookings,
        pendingBookings,
        totalEarnings,
        monthlyEarnings,
        averageRating: guide.ratings?.average || 0,
        totalReviews: guide.ratings?.count || 0
      },
      recentBookings
    });
  } catch (error) {
    console.error('Get guide dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * Get guide bookings
 */
router.get('/bookings', validatePagination, async (req, res) => {
  try {
    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guide = docToObject(guidesSnapshot.docs[0]);
    const guideId = guide._id;

    const { page = 1, limit = 10, status, date } = req.query;

    let query = db.collection('bookings').where('guide', '==', guideId);

    if (status) {
      query = query.where('status', '==', status);
    }

    let bookingsSnapshot = await query.get();
    let bookings = docsToArray(bookingsSnapshot.docs);

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      bookings = bookings.filter(booking => {
        const bookingDate = booking.guideService?.date;
        if (!bookingDate) return false;
        const dateObj = bookingDate.toDate ? bookingDate.toDate() : new Date(bookingDate);
        return dateObj >= filterDate && dateObj < nextDay;
      });
    }

    // Sort
    bookings.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBookings = bookings.slice(skip, skip + parseInt(limit));

    // Populate user data
    const populatedBookings = await Promise.all(
      paginatedBookings.map(async (booking) => {
        if (booking.user) {
          const userDoc = await db.collection('users').doc(booking.user).get();
          if (userDoc.exists) {
            const user = docToObject(userDoc);
            booking.user = {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone
            };
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
    console.error('Get guide bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * Update booking status
 */
router.put('/bookings/:id/status', validateObjectId, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['confirmed', 'cancelled', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guide = docToObject(guidesSnapshot.docs[0]);
    const guideId = guide._id;

    // Get booking
    const bookingDoc = await db.collection('bookings').doc(req.params.id).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Verify booking belongs to this guide
    if (booking.guide !== guideId) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Update booking
    await db.collection('bookings').doc(req.params.id).update({
      status,
      updatedAt: new Date()
    });

    // Get updated booking with populated user
    const updatedDoc = await db.collection('bookings').doc(req.params.id).get();
    let updatedBooking = docToObject(updatedDoc);

    if (updatedBooking.user) {
      const userDoc = await db.collection('users').doc(updatedBooking.user).get();
      if (userDoc.exists) {
        const user = docToObject(userDoc);
        updatedBooking.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
      }
    }

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

/**
 * Get guide schedule
 */
router.get('/schedule', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date required' });
    }

    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guide = docToObject(guidesSnapshot.docs[0]);
    const guideId = guide._id;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get bookings in date range
    const bookingsSnapshot = await db.collection('bookings')
      .where('guide', '==', guideId)
      .get();

    let bookings = docsToArray(bookingsSnapshot.docs);

    // Filter by date range
    bookings = bookings.filter(booking => {
      const bookingDate = booking.guideService?.date;
      if (!bookingDate) return false;
      const dateObj = bookingDate.toDate ? bookingDate.toDate() : new Date(bookingDate);
      return dateObj >= start && dateObj <= end;
    });

    // Populate user data
    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        if (booking.user) {
          const userDoc = await db.collection('users').doc(booking.user).get();
          if (userDoc.exists) {
            const user = docToObject(userDoc);
            booking.user = {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone
            };
          }
        }
        return booking;
      })
    );

    res.json({ bookings: populatedBookings });
  } catch (error) {
    console.error('Get guide schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

/**
 * Update guide availability
 */
router.put('/availability', async (req, res) => {
  try {
    const { schedule } = req.body;

    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guideRef = db.collection('guides').doc(guidesSnapshot.docs[0].id);

    await guideRef.update({
      'availability.schedule': schedule,
      updatedAt: new Date()
    });

    const updatedDoc = await guideRef.get();
    const guide = docToObject(updatedDoc);

    res.json({
      message: 'Availability updated successfully',
      availability: guide.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

/**
 * Update guide profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { bio, specialties, languages, experience, pricing } = req.body;

    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guideRef = db.collection('guides').doc(guidesSnapshot.docs[0].id);
    const guideDoc = await guideRef.get();
    const currentGuide = docToObject(guideDoc);

    const updates = { updatedAt: new Date() };

    if (bio) updates.bio = bio;
    if (specialties) updates.specialties = specialties;
    if (languages) updates.languages = languages;
    if (experience) {
      updates.experience = { ...currentGuide.experience, ...experience };
    }
    if (pricing) {
      updates.pricing = { ...currentGuide.pricing, ...pricing };
    }

    await guideRef.update(updates);

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
      message: 'Profile updated successfully',
      guide
    });
  } catch (error) {
    console.error('Update guide profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Get guide earnings
 */
router.get('/earnings', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Find guide profile
    const guidesSnapshot = await db.collection('guides')
      .where('user', '==', req.user._id)
      .limit(1)
      .get();

    if (guidesSnapshot.empty) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const guide = docToObject(guidesSnapshot.docs[0]);
    const guideId = guide._id;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get bookings
    const bookingsSnapshot = await db.collection('bookings')
      .where('guide', '==', guideId)
      .get();

    let bookings = docsToArray(bookingsSnapshot.docs);

    // Filter by date and payment status
    bookings = bookings.filter(booking => {
      const created = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      return created >= startDate && 
             created <= endDate && 
             booking.payment?.paymentStatus === 'completed';
    });

    // Group by day
    const dailyEarningsMap = {};
    bookings.forEach(booking => {
      const created = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      const dateKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
      
      if (!dailyEarningsMap[dateKey]) {
        dailyEarningsMap[dateKey] = { total: 0, count: 0 };
      }
      dailyEarningsMap[dateKey].total += booking.payment?.amount || 0;
      dailyEarningsMap[dateKey].count += 1;
    });

    // Convert to array format
    const dailyEarnings = Object.entries(dailyEarningsMap)
      .map(([dateKey, data]) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        return {
          _id: { year, month, day },
          total: data.total,
          count: data.count
        };
      })
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        if (a._id.month !== b._id.month) return a._id.month - b._id.month;
        return a._id.day - b._id.day;
      });

    const totalEarnings = dailyEarnings.reduce((sum, item) => sum + item.total, 0);
    const totalBookings = dailyEarnings.reduce((sum, item) => sum + item.count, 0);

    res.json({
      period,
      startDate,
      endDate,
      totalEarnings,
      totalBookings,
      dailyEarnings
    });
  } catch (error) {
    console.error('Get guide earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

export default router;
