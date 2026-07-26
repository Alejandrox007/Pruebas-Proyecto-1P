const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctores.routes');
const medicineRoutes = require('./routes/medicamentos.routes');
const specialtyRoutes = require('./routes/especialidades.routes');
const patientRoutes = require('./routes/pacientes.routes');
const appointmentRoutes = require('./routes/citas.routes');
const prescriptionRoutes = require('./routes/recetas.routes');
const adminRoutes = require('./routes/admin.routes');
const { authenticate, authorize } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:'],
      connectSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      frameAncestors: ['\'none\'']
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' }
}));

const defaultOrigins = ['http://localhost:4200', 'http://localhost:3000'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins.join(','))
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('origin');
  const host = req.get('host');
  
  // Allow if no origin (non-CORS), if origin is in allowed list, or if origin matches the host
  const isSameHost = origin && origin.includes(host);
  if (origin && !allowedOrigins.includes(origin) && !isSameHost) {
    return res.status(403).json({ message: 'Origin is not allowed' });
  }
  if (origin) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.json({ limit: '100kb', strict: true }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Try again later' }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/doctores', authenticate, doctorRoutes);
app.use('/api/medicamentos', authenticate, medicineRoutes);
app.use('/api/especialidades', authenticate, specialtyRoutes);
app.use('/api/pacientes', authenticate, patientRoutes);
app.use('/api/citas', authenticate, appointmentRoutes);
app.use('/api/recetas', authenticate, prescriptionRoutes);
app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);

const angularDistPath = path.join(__dirname, '../client/dist/hospital-client');
app.use(express.static(angularDistPath, { index: false }));
app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(angularDistPath, 'index.html'));
});
app.use(notFound);
app.use(errorHandler);

module.exports = app;
