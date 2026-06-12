const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock config files first to avoid real connections during testing
jest.mock('../src/config/database', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(true),
  };
  return {
    pool: mPool,
    query: jest.fn(),
    connectWithRetry: jest.fn().mockResolvedValue(mPool),
    mockClient
  };
});

jest.mock('../src/config/redis', () => {
  return {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn()
  };
});

jest.mock('../src/config/email', () => {
  return {
    transporter: {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
    },
    verifyEmailConfig: jest.fn().mockResolvedValue(true)
  };
});

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');
const redis = require('../src/config/redis');
const bcrypt = require('bcrypt');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set a default query implementation to handle BEGIN, COMMIT, ROLLBACK
    mockClient.query.mockImplementation((sql) => {
      const upper = sql.trim().toUpperCase();
      if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  describe('POST /api/auth/register', () => {
    const validGuest = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0912345678',
      dateOfBirth: '1990-01-01',
      nationality: 'Vietnamese'
    };

    it('should successfully register a guest', async () => {
      // Setup queries conditionally based on SQL content
      mockClient.query.mockImplementation((sql, params) => {
        const upper = sql.trim().toUpperCase();
        if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
          return Promise.resolve({ rows: [] });
        }
        if (upper.includes('SELECT ID FROM GUESTS') || upper.includes('SELECT ID FROM PUBLIC.GUESTS')) {
          return Promise.resolve({ rows: [] }); // User does not exist
        }
        if (upper.includes('INSERT INTO GUESTS')) {
          return Promise.resolve({
            rows: [{
              id: 1,
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
              phone: '0912345678',
              created_at: new Date()
            }]
          });
        }
        if (upper.includes('SELECT ID FROM MEMBERSHIP_TIERS')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (upper.includes('INSERT INTO GUEST_MEMBERSHIPS')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validGuest);

      if (res.status !== 201) {
        console.log('Register failed response body:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.first_name).toBe('John');
    });

    it('should fail registration with weak password', async () => {
      const weakPasswordGuest = {
        ...validGuest,
        password: 'weak'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordGuest);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should fail registration with invalid phone', async () => {
      const invalidPhoneGuest = {
        ...validGuest,
        phone: '123456789'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidPhoneGuest);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail if email already exists', async () => {
      mockClient.query.mockImplementation((sql) => {
        const upper = sql.trim().toUpperCase();
        if (upper === 'BEGIN' || upper === 'COMMIT' || upper === 'ROLLBACK') {
          return Promise.resolve({ rows: [] });
        }
        if (upper.includes('SELECT ID FROM GUESTS')) {
          return Promise.resolve({ rows: [{ id: 1 }] }); // User exists
        }
        return Promise.resolve({ rows: [] });
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validGuest);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in a guest', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          password_hash: hashedPassword,
          first_name: 'John',
          last_name: 'Doe',
          tier_name: 'Silver',
          points_multiplier: '1.00'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.guest.email).toBe('test@example.com');
    });

    it('should fail login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 12);
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          password_hash: hashedPassword
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
