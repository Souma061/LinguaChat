import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app';
import User from '../src/models/user.model';
import UserSession from '../src/models/userSession.model';

dotenv.config();

describe('Auth Routes', () => {
  let accessToken: string;
  let refreshToken: string;
  let sessionId: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lingo-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await User.deleteMany({});
    await UserSession.deleteMany({});
    await mongoose.disconnect();
  });

  afterEach(async () => {
    // Clean up test data after each test (optional)
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('testuser1');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      userId = res.body.user.id;
    });

    test('should fail with duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'another@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Username already exists');
    });

    test('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.status).toBe(400);
    });

    test('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'pass'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('testuser1');
    });

    test('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser1',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid username or password');
    });

    test('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid username or password');
    });

    test('should create session with device info', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      expect(res.status).toBe(200);

      // Verify session was created
      const sessions = await UserSession.find({ userId });
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/sessions', () => {
    test('should list all active sessions', async () => {
      // Login to get a fresh token for this test
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const testAccessToken = loginRes.body.accessToken;

      // Create another session from different device
      await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Android)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${testAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(res.body.sessions.length).toBeGreaterThan(0);
      expect(res.body.sessions[0]).toHaveProperty('device');
      expect(res.body.sessions[0]).toHaveProperty('ip');
      expect(res.body.sessions[0]).not.toHaveProperty('hashedRefreshToken');

      sessionId = res.body.sessions[0].id;
    });

    test('should fail without authentication', async () => {
      const res = await request(app).get('/api/auth/sessions');

      expect(res.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should refresh access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    test('should fail with missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Refresh token is required');
    });

    test('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout-session', () => {
    test('should logout from specific session', async () => {
      // Get a fresh login and sessions
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const testAccessToken = loginRes.body.accessToken;

      // Get sessions list
      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${testAccessToken}`);

      const testSessionId = sessionsRes.body.sessions[0].id;

      const res = await request(app)
        .post('/api/auth/logout-session')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({
          sessionId: testSessionId
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    test('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout-session')
        .send({
          sessionId: 'some-id'
        });

      expect(res.status).toBe(401);
    });

    test('should fail with missing session ID', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const testAccessToken = loginRes.body.accessToken;

      const res = await request(app)
        .post('/api/auth/logout-session')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Session ID is required');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    test('should logout from all sessions', async () => {
      // Get a fresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const testAccessToken = loginRes.body.accessToken;

      // Create another session to ensure we have multiple
      await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPad)')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${testAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();

      // Verify all sessions are deleted
      const sessionRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const newAccessToken = sessionRes.body.accessToken;
      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${newAccessToken}`);

      // Should have only 1 session (the new one we just created)
      expect(sessionsRes.body.sessions.length).toBe(1);
    });

    test('should fail without authentication', async () => {
      const res = await request(app).post('/api/auth/logout-all');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get user profile', async () => {
      // Get a fresh login token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser1',
          password: 'password123'
        });

      const testAccessToken = loginRes.body.accessToken;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('role');
    });

    test('should fail without authentication', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});
