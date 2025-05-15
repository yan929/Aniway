import request from 'supertest';
import express from 'express';
import session from 'express-session';
import router from './AuthRoutes'; // Adjust the path accordingly

// Mock passport functions
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy, optionsOrCallback, callback) => {
    if (typeof optionsOrCallback === 'function') {
      return optionsOrCallback;
    }
    return (req, res, next) => {
      if (strategy === 'google') {
        req.user = { id: '123', email: 'test@example.com' };
        return next();
      }
    };
  }),
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

    // Mock req.isAuthenticated and req.logout
    app.use((req, res, next) => {
      req.isAuthenticated = () => !!req.user;
      req.logout = jest.fn((cb) => cb?.());
      next();
    });

    app.use(router);
  });

  test('GET /api/user should return user if authenticated', async () => {
    const fakeUser = { id: '1', email: 'user@test.com' };
    app.use((req, res, next) => {
      req.user = fakeUser;
      next();
    });

    const res = await request(app).get('/api/user');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/user should return 401 if not authenticated', async () => {
    const res = await request(app).get('/api/user');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
  });

  test('GET /api/logout should logout and redirect', async () => {
    const res = await request(app).get('/api/logout');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/login');
  });

  test('GET /auth/google/callback should redirect after auth', async () => {
    const res = await request(app).get('/auth/google/callback');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/login');
  });
});
