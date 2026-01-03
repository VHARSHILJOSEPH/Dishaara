import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation
export const validateUserRegistration = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

// Guide validation
export const validateGuideProfile = [
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('pricing.hourlyRate').isNumeric().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
  handleValidationErrors
];

// Event validation
export const validateEvent = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('category').isIn(['festival', 'cultural', 'adventure', 'food', 'music', 'art', 'sports', 'religious']).withMessage('Invalid category'),
  body('location.name').trim().notEmpty().withMessage('Location name required'),
  body('schedule.startDate').isISO8601().withMessage('Valid start date required'),
  body('schedule.endDate').isISO8601().withMessage('Valid end date required'),
  body('pricing.adultPrice').optional().isNumeric().isFloat({ min: 0 }).withMessage('Adult price must be non-negative'),
  handleValidationErrors
];

// Booking validation
export const validateBooking = [
  body('type').isIn(['guide', 'event', 'vehicle', 'hotel', 'flight']).withMessage('Invalid booking type'),
  body('payment.amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
  body('payment.method').isIn(['card', 'upi', 'netbanking', 'wallet', 'cash']).withMessage('Invalid payment method'),
  handleValidationErrors
];

// Trip plan validation
export const validateTripPlan = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('destination.city').trim().notEmpty().withMessage('City required'),
  body('duration.startDate').isISO8601().withMessage('Valid start date required'),
  body('duration.endDate').isISO8601().withMessage('Valid end date required'),
  body('preferences.theme').optional().isIn(['city', 'nature', 'cultural', 'adventure', 'beaches', 'mountains']).withMessage('Invalid theme'),
  handleValidationErrors
];

// Vehicle validation
export const validateVehicle = [
  body('type').isIn(['car', 'bike', 'scooter', 'bus', 'van', 'truck']).withMessage('Invalid vehicle type'),
  body('make').trim().notEmpty().withMessage('Make required'),
  body('model').trim().notEmpty().withMessage('Model required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number required'),
  body('capacity.passengers').isInt({ min: 1 }).withMessage('Passenger capacity must be at least 1'),
  body('pricing.hourlyRate').isNumeric().isFloat({ min: 0 }).withMessage('Hourly rate must be non-negative'),
  body('pricing.dailyRate').isNumeric().isFloat({ min: 0 }).withMessage('Daily rate must be non-negative'),
  handleValidationErrors
];

// Common validators
// Firestore uses alphanumeric IDs (not MongoDB ObjectIds)
export const validateObjectId = [
  param('id').matches(/^[a-zA-Z0-9_-]{1,}$/).withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];
