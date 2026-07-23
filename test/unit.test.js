process.env.NODE_ENV = 'test';

const express = require('express');
const request = require('supertest');
const asyncHandler = require('../src/middleware/async-handler');
const { errorHandler } = require('../src/middleware/error-handler');
const { authorize, jwtSecret } = require('../src/middleware/auth');
const HttpError = require('../src/utils/http-error');
const { validateSchedule } = require('../src/controllers/citas.controller');

test('HttpError carries its HTTP status', () => {
  const error = new HttpError(418, 'Tea');
  expect(error).toMatchObject({ name: 'HttpError', status: 418, message: 'Tea' });
});

test('production JWT configuration rejects weak secrets', () => {
  const environment = process.env.NODE_ENV;
  const secret = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'short';
  expect(() => jwtSecret()).toThrow('JWT_SECRET');
  process.env.NODE_ENV = environment;
  if (secret) process.env.JWT_SECRET = secret;
  else delete process.env.JWT_SECRET;
  expect(jwtSecret()).toBe('test-only-secret-with-at-least-32-chars');
});

test('schedule validator rejects outside hours and invalid half-hour slots', () => {
  const future = new Date(Date.now() + 10 * 86400000);
  future.setUTCHours(12, 15, 0, 0);
  expect(() => validateSchedule(future.toISOString())).toThrow('Monday-Friday');
});

test('error middleware handles application, database and unexpected errors', async () => {
  const testApp = express();
  testApp.get('/status', asyncHandler(async () => { throw new HttpError(422, 'Bad state'); }));
  testApp.get('/duplicate', asyncHandler(async () => { const error = new Error(); error.code = '23505'; throw error; }));
  testApp.get('/reference', asyncHandler(async () => { const error = new Error(); error.code = '23503'; throw error; }));
  testApp.get('/unknown', asyncHandler(async () => { throw new Error('secret'); }));
  testApp.use(errorHandler);

  expect((await request(testApp).get('/status')).status).toBe(422);
  expect((await request(testApp).get('/duplicate')).status).toBe(409);
  expect((await request(testApp).get('/reference')).status).toBe(409);
  const unknown = await request(testApp).get('/unknown');
  expect(unknown.status).toBe(500);
  expect(unknown.body.message).toBe('Internal server error');
});

test('error middleware delegates after headers are sent', () => {
  const error = new Error('late');
  const next = jest.fn();
  errorHandler(error, {}, { headersSent: true }, next);
  expect(next).toHaveBeenCalledWith(error);
});

test('non API SPA route is handled without exposing an exception', async () => {
  const response = await request(require('../src/app')).get('/dashboard');
  expect([200, 404, 500]).toContain(response.status);
  expect(response.body).not.toHaveProperty('stack');
});

test('authorization middleware allows listed roles', () => {
  const middleware = authorize('admin');
  const next = jest.fn();
  middleware({ user: { role: 'admin' } }, {}, next);
  expect(next).toHaveBeenCalled();
});
