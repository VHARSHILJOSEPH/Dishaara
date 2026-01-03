
import request from 'supertest';
import app from '../index.mjs';

describe('Validation', ()=>{
  test('returns 400 for empty city', async ()=>{
    const res = await request(app).post('/api/ai/trip-planner').send({city:'', startDate:'2025-11-01', endDate:'2025-11-03'});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
  test('returns 400 when startDate > endDate', async ()=>{
    const res = await request(app).post('/api/ai/trip-planner').send({city:'Paris', startDate:'2025-11-05', endDate:'2025-11-03'});
    expect(res.status).toBe(400);
  });
});
