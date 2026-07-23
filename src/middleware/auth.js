const jwt = require('jsonwebtoken');

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production');
  }
  return secret || 'test-only-secret-with-at-least-32-chars';
}

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] });
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    jwtSecret(),
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = { authenticate, authorize, signToken, jwtSecret };
