import request from 'supertest';
import app from '../index.mjs';

describe('API Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create a test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
    
    authToken = response.body.token;
    testUser = response.body.user;
  });

  describe('Authentication', () => {
    test('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    test('POST /api/auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    test('GET /api/auth/me - should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('GET /api/auth/me - should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Trip Planner', () => {
    test('POST /api/ai/trip-planner - should generate trip plan', async () => {
      const response = await request(app)
        .post('/api/ai/trip-planner')
        .send({
          city: 'Mumbai',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          options: {
            theme: 'city',
            style: 'sightseeing',
            pace: 'moderate',
            budget: 'mid',
            travelers: 2
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('itinerary');
      expect(response.body).toHaveProperty('metadata');
    });

    test('POST /api/ai/trip-planner - should reject request without city', async () => {
      const response = await request(app)
        .post('/api/ai/trip-planner')
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          options: {
            theme: 'city',
            style: 'sightseeing',
            pace: 'moderate',
            budget: 'mid',
            travelers: 2
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Events', () => {
    test('GET /api/events - should get all events', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    test('POST /api/events - should create new event with auth', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          description: 'Test event description',
          date: '2024-01-15',
          time: '10:00',
          location: 'Test Location',
          category: 'cultural',
          price: 100,
          maxParticipants: 50
        });

      expect(response.status).toBe(201);
      expect(response.body.event.title).toBe('Test Event');
    });
  });

  describe('Bookings', () => {
    let eventId;

    beforeAll(async () => {
      // Create a test event first
      const eventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event for Booking',
          description: 'Test event for booking',
          date: '2024-01-15',
          time: '10:00',
          location: 'Test Location',
          category: 'cultural',
          price: 100,
          maxParticipants: 50
        });
      
      eventId = eventResponse.body.event._id;
    });

    test('POST /api/bookings - should create booking', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'event',
          event: eventId,
          participants: 2,
          payment: {
            amount: 200,
            currency: 'INR',
            method: 'card'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.booking.type).toBe('event');
    });
  });

  describe('Admin Routes', () => {
    test('GET /api/admin/dashboard/stats - should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
