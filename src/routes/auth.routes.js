const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me, register } = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/async-handler');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again later' }
});

router.post('/register', authLimiter, validate({ body: schemas.register }), asyncHandler(register));
router.post('/login', authLimiter, validate({ body: schemas.login }), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));

module.exports = router;
