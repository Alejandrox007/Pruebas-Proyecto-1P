const express = require('express');
const path = require('node:path');
const patientRoutes = require('./routes/pacientes.routes');
const medicamentosRoutes = require('./routes/medicamentos.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');
const doctoresRoutes = require('./routes/doctores.routes');
const { runTests, getTestLogs } = require('./testRunner');

const app = express();
app.disable('x-powered-by');

// CORS Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3001',
  'http://localhost:3001'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  }

  return res.status(403).json({
    message: 'CORS policy: origin not allowed'
  });
});

// Middleware to parse JSON from request body
app.use(express.json());

// Serve static files from Angular dist folder
const angularDistPath = path.join(__dirname, '../client/dist/hospital-client');
app.use(express.static(angularDistPath));


app.use('/api/pacientes', patientRoutes);
app.use('/api/medicamentos', medicamentosRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/doctores', doctoresRoutes);

// Endpoint to run tests with custom failure configuration
app.post('/api/run-tests', (req, res) => {
  const { failTests } = req.body;
  
  runTests(failTests, (error, result) => {
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    res.json(result);
  });
});

// Endpoint to get test logs
app.get('/api/test-logs', (req, res) => {
  try {
    const logs = getTestLogs();
    res.json({ success: true, logs: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPA fallback: serve index.html for all non-API routes (Angular Router)
app.use((req, res, next) => {
  // Don't redirect API calls
  if (req.url.startsWith('/api')) {
    return next();
  }
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, '../client/dist/hospital-client/index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Export app to use it in tests or in a separate server file
module.exports = app;
