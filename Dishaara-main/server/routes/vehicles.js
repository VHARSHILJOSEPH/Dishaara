/**
 * Vehicles Routes - Firestore Implementation
 */

import express from 'express';
import { db, docToObject, docsToArray } from '../firebase/firebase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateVehicle, validateObjectId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * Get all vehicles with filters
 */
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      city,
      minCapacity,
      maxPrice,
      features,
      isAvailable = true
    } = req.query;

    let query = db.collection('vehicles')
      .where('status', '==', 'active')
      .where('isVerified', '==', true);

    if (type) {
      query = query.where('type', '==', type);
    }

    let vehiclesSnapshot = await query.get();
    let vehicles = docsToArray(vehiclesSnapshot.docs);

    // Client-side filtering
    if (city) {
      const cityRegex = new RegExp(city, 'i');
      vehicles = vehicles.filter(v => v.location?.city && cityRegex.test(v.location.city));
    }

    if (minCapacity) {
      vehicles = vehicles.filter(v => v.capacity?.passengers >= parseInt(minCapacity));
    }

    if (maxPrice) {
      vehicles = vehicles.filter(v => v.pricing?.dailyRate <= parseFloat(maxPrice));
    }

    if (features) {
      const featureList = features.split(',');
      vehicles = vehicles.filter(v => {
        return featureList.every(f => v.features?.[f] === true);
      });
    }

    // Sort
    vehicles.sort((a, b) => {
      const ratingA = a.ratings?.average || 0;
      const ratingB = b.ratings?.average || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));

    // Populate owner data
    const populatedVehicles = await Promise.all(
      paginatedVehicles.map(async (vehicle) => {
        if (vehicle.owner) {
          try {
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
          } catch (error) {
            console.error('Error populating owner:', error);
          }
        }
        return vehicle;
      })
    );

    res.json({
      vehicles: populatedVehicles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(vehicles.length / parseInt(limit)),
        total: vehicles.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

/**
 * Get vehicle by ID
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const vehicleDoc = await db.collection('vehicles').doc(req.params.id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    let vehicle = docToObject(vehicleDoc);

    // Populate owner
    if (vehicle.owner) {
      const ownerDoc = await db.collection('users').doc(vehicle.owner).get();
      if (ownerDoc.exists) {
        const owner = docToObject(ownerDoc);
        vehicle.owner = {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          avatar: owner.avatar
        };
      }
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

/**
 * Create vehicle
 */
router.post('/', authenticateToken, validateVehicle, async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      owner: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const vehicleRef = db.collection('vehicles').doc();
    await vehicleRef.set(vehicleData);

    const vehicleDoc = await vehicleRef.get();
    let vehicle = docToObject(vehicleDoc);

    // Populate owner
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

    res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

/**
 * Update vehicle
 */
router.put('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const vehicleDoc = await db.collection('vehicles').doc(req.params.id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = docToObject(vehicleDoc);

    // Check authorization
    if (vehicle.owner !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this vehicle' });
    }

    await db.collection('vehicles').doc(req.params.id).update({
      ...req.body,
      updatedAt: new Date()
    });

    const updatedDoc = await db.collection('vehicles').doc(req.params.id).get();
    let updatedVehicle = docToObject(updatedDoc);

    // Populate owner
    if (updatedVehicle.owner) {
      const ownerDoc = await db.collection('users').doc(updatedVehicle.owner).get();
      if (ownerDoc.exists) {
        const owner = docToObject(ownerDoc);
        updatedVehicle.owner = {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone
        };
      }
    }

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

/**
 * Delete vehicle
 */
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const vehicleDoc = await db.collection('vehicles').doc(req.params.id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = docToObject(vehicleDoc);

    // Check authorization
    if (vehicle.owner !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this vehicle' });
    }

    await db.collection('vehicles').doc(req.params.id).delete();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

/**
 * Search vehicles by location
 */
router.get('/search/location', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    const vehiclesSnapshot = await db.collection('vehicles')
      .where('status', '==', 'active')
      .where('isVerified', '==', true)
      .get();

    let vehicles = docsToArray(vehiclesSnapshot.docs);

    // Filter by distance
    vehicles = vehicles.filter(vehicle => {
      if (!vehicle.location?.coordinates?.lat || !vehicle.location?.coordinates?.lng) {
        return false;
      }

      const vehicleLat = vehicle.location.coordinates.lat;
      const vehicleLng = vehicle.location.coordinates.lng;

      const R = 6371;
      const dLat = (vehicleLat - centerLat) * Math.PI / 180;
      const dLng = (vehicleLng - centerLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(centerLat * Math.PI / 180) * Math.cos(vehicleLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= parseFloat(radius);
    });

    // Populate owners
    const populatedVehicles = await Promise.all(
      vehicles.slice(0, 20).map(async (vehicle) => {
        if (vehicle.owner) {
          try {
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
          } catch (error) {
            console.error('Error populating owner:', error);
          }
        }
        return vehicle;
      })
    );

    res.json({ vehicles: populatedVehicles });
  } catch (error) {
    console.error('Search vehicles by location error:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
});

/**
 * Check vehicle availability
 */
router.get('/:id/availability', validateObjectId, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date required' });
    }

    const vehicleDoc = await db.collection('vehicles').doc(req.params.id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = docToObject(vehicleDoc);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if vehicle is blocked
    const isBlocked = vehicle.availability?.schedule?.some(schedule => {
      const scheduleStart = schedule.startDate?.toDate ? schedule.startDate.toDate() : new Date(schedule.startDate);
      const scheduleEnd = schedule.endDate?.toDate ? schedule.endDate.toDate() : new Date(schedule.endDate);

      return schedule.isBlocked &&
             ((start >= scheduleStart && start <= scheduleEnd) ||
              (end >= scheduleStart && end <= scheduleEnd) ||
              (start <= scheduleStart && end >= scheduleEnd));
    });

    if (isBlocked) {
      return res.json({
        available: false,
        message: 'Vehicle not available during the requested period'
      });
    }

    res.json({
      available: true,
      pricing: {
        dailyRate: vehicle.pricing?.dailyRate,
        hourlyRate: vehicle.pricing?.hourlyRate,
        currency: vehicle.pricing?.currency
      }
    });
  } catch (error) {
    console.error('Check vehicle availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

/**
 * Get user's vehicles
 */
router.get('/my-vehicles/list', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = db.collection('vehicles').where('owner', '==', req.user._id);

    if (status) {
      query = query.where('status', '==', status);
    }

    const vehiclesSnapshot = await query.get();
    let vehicles = docsToArray(vehiclesSnapshot.docs);

    // Sort
    vehicles.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));

    res.json({
      vehicles: paginatedVehicles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(vehicles.length / parseInt(limit)),
        total: vehicles.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

export default router;
