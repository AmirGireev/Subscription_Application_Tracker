import 'dotenv/config';
import request from 'supertest';
import app from '../app';
import { pool } from '../db';

afterAll(() => pool.end());

const register = async () => {
  const email = `t${Date.now()}${Math.random()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'password123' });
  return { Authorization: `Bearer ${res.body.token}` };
};

it('rejects unauthenticated access', async () => {
  await request(app).get('/api/subscriptions').expect(401);
});

it('stops user B from touching user A data', async () => {
  const a = await register();
  const b = await register();
  const created = await request(app).post('/api/subscriptions').set(a)
    .send({ name: 'Notion', cost_cents: 800, billing_cycle: 'monthly' }).expect(201);
  await request(app).delete(`/api/subscriptions/${created.body.id}`).set(b).expect(404);
  const list = await request(app).get('/api/subscriptions').set(b);
  expect(list.body).toHaveLength(0);
});

it('wrong password returns 401', async () => {
  const email = `test${Date.now()}@example.com`;
  await request(app).post('/api/auth/register').send({ email, password: 'password123' });
  await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' }).expect(401);
});

it('duplicate email returns 409', async () => {
  const email = `test${Date.now()}@example.com`;
  await request(app).post('/api/auth/register').send({ email, password: 'password123' }).expect(201);
  await request(app).post('/api/auth/register').send({ email, password: 'password123' }).expect(409);
});

it('creates, then lists a subscription', async () => {
  const auth = await register();
  await request(app).post('/api/subscriptions').set(auth)
    .send({ name: 'Spotify', cost_cents: 999, billing_cycle: 'monthly' }).expect(201);
  const list = await request(app).get('/api/subscriptions').set(auth).expect(200);
  expect(list.body).toHaveLength(1);
  expect(list.body[0].name).toBe('Spotify');
});

it('negative cost returns 400', async () => {
  const auth = await register();
  await request(app).post('/api/subscriptions').set(auth)
    .send({ name: 'Netflix', cost_cents: -100, billing_cycle: 'monthly' }).expect(400);
});

it('cancelled subscriptions are excluded from /stats', async () => {
  const auth = await register();
  await request(app).post('/api/subscriptions').set(auth)
    .send({ name: 'Spotify', cost_cents: 1000, billing_cycle: 'monthly', status: 'cancelled' }).expect(201);
  const stats = await request(app).get('/api/subscriptions/stats').set(auth).expect(200);
  expect(stats.body.activeCount).toBe(0);
});

it('category and status filters work', async () => {
  const auth = await register();
  await request(app).post('/api/subscriptions').set(auth)
    .send({ name: 'Spotify', cost_cents: 1000, billing_cycle: 'monthly', category: 'music', status: 'active' });
  await request(app).post('/api/subscriptions').set(auth)
    .send({ name: 'Netflix', cost_cents: 1500, billing_cycle: 'monthly', category: 'video', status: 'cancelled' });

  const musicSubs = await request(app).get('/api/subscriptions?category=music').set(auth).expect(200);
  expect(musicSubs.body).toHaveLength(1);

  const activeSubs = await request(app).get('/api/subscriptions?status=active').set(auth).expect(200);
  expect(activeSubs.body).toHaveLength(1);
});