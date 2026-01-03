/**
 * Events Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateEvent, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get all events with filters
 */
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      city,
      startDate,
      endDate,
      isFeatured,
      status = 'published'
    } = req.query;

    let query = db.collection('events').where('status', '==', status);

    if (category) {
      query = query.where('category', '==', category);
    }

    if (isFeatured !== undefined) {
      query = query.where('isFeatured', '==', isFeatured === 'true');
    }

    let eventsSnapshot = await query.get();
    let events = docsToArray(eventsSnapshot.docs);

    // Client-side filtering for complex queries
    if (city) {
      const cityRegex = new RegExp(city, 'i');
      events = events.filter(e => e.location?.city && cityRegex.test(e.location.city));
    }

    if (startDate) {
      const start = new Date(startDate);
      events = events.filter(e => {
        const eventStart = e.schedule?.startDate?.toDate ? e.schedule.startDate.toDate() : new Date(e.schedule?.startDate);
        return eventStart >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      events = events.filter(e => {
        const eventEnd = e.schedule?.endDate?.toDate ? e.schedule.endDate.toDate() : new Date(e.schedule?.endDate);
        return eventEnd <= end;
      });
    }

    // Sort
    events.sort((a, b) => {
      if (b.isFeatured !== a.isFeatured) return b.isFeatured - a.isFeatured;
      const dateA = a.schedule?.startDate?.toDate ? a.schedule.startDate.toDate() : new Date(a.schedule?.startDate || 0);
      const dateB = b.schedule?.startDate?.toDate ? b.schedule.startDate.toDate() : new Date(b.schedule?.startDate || 0);
      return dateA - dateB;
    });

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
 * Get event by ID
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(docToObject(eventDoc));
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * Create event (admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), validateEvent, async (req, res) => {
  try {
    const eventRef = db.collection('events').doc();
    const eventData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await eventRef.set(eventData);

    const eventDoc = await eventRef.get();
    res.status(201).json({
      message: 'Event created successfully',
      event: docToObject(eventDoc)
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * Update event
 */
router.put('/:id', authenticateToken, requireRole(['admin']), validateObjectId, async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await eventRef.update({
      ...req.body,
      updatedAt: new Date()
    });

    const updatedDoc = await eventRef.get();
    res.json({
      message: 'Event updated successfully',
      event: docToObject(updatedDoc)
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * Delete event
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), validateObjectId, async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.collection('events').doc(req.params.id).delete();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * Search events by location
 */
router.get('/search/location', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    const eventsSnapshot = await db.collection('events')
      .where('status', '==', 'published')
      .get();

    let events = docsToArray(eventsSnapshot.docs);

    // Filter by distance
    events = events.filter(event => {
      if (!event.location?.coordinates?.lat || !event.location?.coordinates?.lng) {
        return false;
      }

      const eventLat = event.location.coordinates.lat;
      const eventLng = event.location.coordinates.lng;

      const R = 6371;
      const dLat = (eventLat - centerLat) * Math.PI / 180;
      const dLng = (eventLng - centerLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(centerLat * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= parseFloat(radius);
    });

    res.json({ events: events.slice(0, 20) });
  } catch (error) {
    console.error('Search events by location error:', error);
    res.status(500).json({ error: 'Failed to search events' });
  }
});

/**
 * Get featured events
 */
router.get('/featured/list', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events')
      .where('status', '==', 'published')
      .where('isFeatured', '==', true)
      .orderBy('schedule.startDate', 'asc')
      .limit(10)
      .get();

    res.json({ events: docsToArray(eventsSnapshot.docs) });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({ error: 'Failed to fetch featured events' });
  }
});

/**
 * Get upcoming events
 */
router.get('/upcoming/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = new Date();

    const eventsSnapshot = await db.collection('events')
      .where('status', '==', 'published')
      .get();

    let events = docsToArray(eventsSnapshot.docs);

    // Filter upcoming events
    events = events.filter(event => {
      const eventStart = event.schedule?.startDate?.toDate ? event.schedule.startDate.toDate() : new Date(event.schedule?.startDate);
      return eventStart >= now;
    });

    // Sort by start date
    events.sort((a, b) => {
      const dateA = a.schedule?.startDate?.toDate ? a.schedule.startDate.toDate() : new Date(a.schedule?.startDate || 0);
      const dateB = b.schedule?.startDate?.toDate ? b.schedule.startDate.toDate() : new Date(b.schedule?.startDate || 0);
      return dateA - dateB;
    });

    res.json({ events: events.slice(0, parseInt(limit)) });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

export default router;
