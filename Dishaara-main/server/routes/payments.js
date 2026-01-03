/**
 * Payments Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * Create payment intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR' } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'Booking ID and amount are required' });
    }

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to pay for this booking' });
    }

    // Simulate payment intent creation
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100,
      currency: currency.toLowerCase(),
      status: 'requires_payment_method'
    };

    // Update booking
    await db.collection('bookings').doc(bookingId).update({
      'payment.transactionId': paymentIntent.id,
      'payment.paymentStatus': 'pending',
      updatedAt: new Date()
    });

    res.json({
      paymentIntent,
      booking: {
        id: booking._id,
        amount: booking.payment?.amount,
        currency: booking.payment?.currency
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * Confirm payment
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({ error: 'Payment intent ID and booking ID are required' });
    }

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to confirm this payment' });
    }

    // Update booking
    await db.collection('bookings').doc(bookingId).update({
      'payment.paymentStatus': 'completed',
      'payment.paidAt': new Date(),
      status: 'confirmed',
      updatedAt: new Date()
    });

    const updatedDoc = await db.collection('bookings').doc(bookingId).get();
    const updatedBooking = docToObject(updatedDoc);

    res.json({
      message: 'Payment confirmed successfully',
      booking: {
        id: updatedBooking._id,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.payment?.paymentStatus,
        paidAt: updatedBooking.payment?.paidAt
      }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * Get payment history
 */
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = db.collection('bookings').where('user', '==', req.user._id);

    if (status) {
      query = query.where('payment.paymentStatus', '==', status);
    }

    const bookingsSnapshot = await query.get();
    let bookings = docsToArray(bookingsSnapshot.docs);

    // Extract payment info
    const payments = bookings.map(booking => ({
      _id: booking._id,
      payment: booking.payment,
      status: booking.status,
      type: booking.type,
      createdAt: booking.createdAt
    }));

    // Sort
    payments.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPayments = payments.slice(skip, skip + parseInt(limit));

    res.json({
      payments: paginatedPayments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(payments.length / parseInt(limit)),
        total: payments.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

/**
 * Process refund
 */
router.post('/refund', async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;

    if (!bookingId || !reason) {
      return res.status(400).json({ error: 'Booking ID and reason are required' });
    }

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = docToObject(bookingDoc);

    // Check authorization
    if (booking.user !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized to refund this booking' });
    }

    // Check if booking can be refunded
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return res.status(400).json({ error: 'Booking cannot be refunded' });
    }

    const refundAmount = amount || booking.payment?.amount || 0;
    const refundPercentage = booking.payment?.amount ? (refundAmount / booking.payment.amount) * 100 : 0;

    // Update booking
    await db.collection('bookings').doc(bookingId).update({
      'cancellation.requestedAt': new Date(),
      'cancellation.reason': reason,
      'cancellation.refundAmount': refundAmount,
      'cancellation.refundStatus': 'pending',
      status: 'cancelled',
      updatedAt: new Date()
    });

    res.json({
      message: 'Refund request submitted successfully',
      refund: {
        amount: refundAmount,
        percentage: refundPercentage,
        status: 'pending',
        requestedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

/**
 * Get payment methods
 */
router.get('/methods', async (req, res) => {
  try {
    // Mock payment methods - in production, fetch from Stripe
    const paymentMethods = [
      {
        id: 'pm_card_visa',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      },
      {
        id: 'pm_card_mastercard',
        type: 'card',
        card: {
          brand: 'mastercard',
          last4: '5555',
          exp_month: 8,
          exp_year: 2026
        }
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

export default router;
