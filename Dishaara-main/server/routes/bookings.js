/**
 * Bookings Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBooking, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get user's bookings
 */
router.get('/my-bookings', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    let query = db.collection('bookings').where('user', '==', req.user._id);

    if (status) {
      query = query.where('status', '==', status);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    const bookingsSnapshot = await query.get();
    let bookings = docsToArray(bookingsSnapshot.docs);

    // Sort
    bookings.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBookings = bookings.slice(skip, skip + parseInt(limit));

    // Populate references
    const populatedBookings = await Promise.all(
      paginatedBookings.map(async (booking) => {
        // Populate guide
        if (booking.guide) {
          try {
            const guideDoc = await db.collection('guides').doc(booking.guide).get();
            if (guideDoc.exists) {
              const guide = docToObject(guideDoc);
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
              booking.guide = guide;
            }
          } catch (error) {
            console.error('Error populating guide:', error);
          }
        }

        // Populate event
        if (booking.event) {
          try {
            const eventDoc = await db.collection('events').doc(booking.event).get();
            if (eventDoc.exists) {
              booking.event = docToObject(eventDoc);
            }
          } catch (error) {
            console.error('Error populating event:', error);
          }
        }

        // Populate vehicle
        if (booking.vehicle) {
          try {
            const vehicleDoc = await db.collection('vehicles').doc(booking.vehicle).get();
            if (vehicleDoc.exists) {
              booking.vehicle = docToObject(vehicleDoc);
            }
          } catch (error) {
            console.error('Error populating vehicle:', error);
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
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * Get booking by ID
 */
router.get('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const bookingDoc = await db.collection('bookings').doc(req.params.id).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    // Populate references
    if (booking.guide) {
      const guideDoc = await db.collection('guides').doc(booking.guide).get();
      if (guideDoc.exists) {
        const guide = docToObject(guideDoc);
        if (guide.user) {
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
        }
        booking.guide = guide;
      }
    }

    if (booking.event) {
      const eventDoc = await db.collection('events').doc(booking.event).get();
      if (eventDoc.exists) {
        booking.event = docToObject(eventDoc);
      }
    }

    if (booking.vehicle) {
      const vehicleDoc = await db.collection('vehicles').doc(booking.vehicle).get();
      if (vehicleDoc.exists) {
        const vehicle = docToObject(vehicleDoc);
        if (vehicle.owner) {
          const ownerDoc = await db.collection('users').doc(vehicle.owner).get();
          if (ownerDoc.exists) {
            const owner = docToObject(ownerDoc);
            vehicle.owner = {
              _id: owner._id,
              name: owner.name,
              email: owner.email,
              phone: owner.phone
            };
          }
        }
        booking.vehicle = vehicle;
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

/**
 * Create booking
 */
router.post('/', authenticateToken, validateBooking, async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      user: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate and calculate amounts based on type
    if (bookingData.type === 'guide' && bookingData.guide) {
      const guideDoc = await db.collection('guides').doc(bookingData.guide).get();
      if (!guideDoc.exists) {
        return res.status(404).json({ error: 'Guide not found' });
      }
      const guide = docToObject(guideDoc);
      const duration = bookingData.guideService?.duration || 1;
      bookingData.payment = bookingData.payment || {};
      bookingData.payment.amount = guide.pricing?.hourlyRate * duration;
      bookingData.payment.currency = guide.pricing?.currency || 'INR';
    }

    if (bookingData.type === 'event' && bookingData.event) {
      const eventDoc = await db.collection('events').doc(bookingData.event).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = docToObject(eventDoc);
      const attendees = bookingData.eventDetails?.attendees || [];
      let totalAmount = 0;
      attendees.forEach(attendee => {
        switch (attendee.ticketType) {
          case 'adult':
            totalAmount += event.pricing?.adultPrice || 0;
            break;
          case 'child':
            totalAmount += event.pricing?.childPrice || 0;
            break;
          case 'senior':
            totalAmount += event.pricing?.seniorPrice || 0;
            break;
        }
      });
      bookingData.payment = bookingData.payment || {};
      bookingData.payment.amount = totalAmount;
      bookingData.payment.currency = event.pricing?.currency || 'INR';
    }

    if (bookingData.type === 'vehicle' && bookingData.vehicle) {
      const vehicleDoc = await db.collection('vehicles').doc(bookingData.vehicle).get();
      if (!vehicleDoc.exists) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      const vehicle = docToObject(vehicleDoc);
      const startDate = new Date(bookingData.vehicleDetails.pickupDate);
      const endDate = new Date(bookingData.vehicleDetails.returnDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      bookingData.payment = bookingData.payment || {};
      bookingData.payment.amount = vehicle.pricing?.dailyRate * days;
      bookingData.payment.currency = vehicle.pricing?.currency || 'INR';
    }

    // Set default payment status if not provided
    if (!bookingData.payment) {
      bookingData.payment = {
        amount: 0,
        currency: 'INR',
        method: 'card',
        paymentStatus: 'pending'
      };
    }

    const bookingRef = db.collection('bookings').doc();
    await bookingRef.set(bookingData);

    // Get created booking with populated data
    const bookingDoc = await bookingRef.get();
    let booking = docToObject(bookingDoc);

    // Populate references for response
    if (booking.guide) {
      const guideDoc = await db.collection('guides').doc(booking.guide).get();
      if (guideDoc.exists) {
        booking.guide = docToObject(guideDoc);
      }
    }

    if (booking.event) {
      const eventDoc = await db.collection('events').doc(booking.event).get();
      if (eventDoc.exists) {
        booking.event = docToObject(eventDoc);
      }
    }

    if (booking.vehicle) {
      const vehicleDoc = await db.collection('vehicles').doc(booking.vehicle).get();
      if (vehicleDoc.exists) {
        booking.vehicle = docToObject(vehicleDoc);
      }
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * Update booking status
 */
router.put('/:id/status', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bookingDoc = await db.collection('bookings').doc(req.params.id).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const updates = { status, updatedAt: new Date() };

    if (status === 'confirmed') {
      updates['payment.paymentStatus'] = 'completed';
      updates['payment.paidAt'] = new Date();
    }

    await db.collection('bookings').doc(req.params.id).update(updates);

    const updatedDoc = await db.collection('bookings').doc(req.params.id).get();
    res.json({
      message: 'Booking status updated successfully',
      booking: docToObject(updatedDoc)
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

/**
 * Cancel booking
 */
router.put('/:id/cancel', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { reason } = req.body;

    const bookingDoc = await db.collection('bookings').doc(req.params.id).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Calculate refund amount
    const now = new Date();
    const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
    const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);

    const updates = {
      status: 'cancelled',
      'cancellation.requestedAt': new Date(),
      'cancellation.reason': reason,
      updatedAt: new Date()
    };

    if (hoursDiff >= 24) {
      updates['cancellation.refundAmount'] = (booking.payment?.amount || 0) * 0.8;
      updates['cancellation.refundStatus'] = 'pending';
    } else {
      updates['cancellation.refundAmount'] = 0;
      updates['cancellation.refundStatus'] = 'rejected';
    }

    await db.collection('bookings').doc(req.params.id).update(updates);

    const updatedDoc = await db.collection('bookings').doc(req.params.id).get();
    res.json({
      message: 'Booking cancelled successfully',
      booking: docToObject(updatedDoc)
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

/**
 * Get booking statistics
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const bookingsSnapshot = await db.collection('bookings')
      .where('user', '==', req.user._id)
      .get();

    const bookings = docsToArray(bookingsSnapshot.docs);

    // Calculate stats manually
    const totalBookings = bookings.length;

    // Group by status
    const statusBreakdown = {};
    bookings.forEach(booking => {
      const status = booking.status || 'pending';
      if (!statusBreakdown[status]) {
        statusBreakdown[status] = { count: 0, totalAmount: 0 };
      }
      statusBreakdown[status].count++;
      statusBreakdown[status].totalAmount += booking.payment?.amount || 0;
    });

    // Convert to array format
    const statusBreakdownArray = Object.entries(statusBreakdown).map(([_id, data]) => ({
      _id,
      count: data.count,
      totalAmount: data.totalAmount
    }));

    // Calculate total spent (completed payments only)
    const totalSpent = bookings
      .filter(b => b.payment?.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

    res.json({
      totalBookings,
      totalSpent,
      statusBreakdown: statusBreakdownArray
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

export default router;
