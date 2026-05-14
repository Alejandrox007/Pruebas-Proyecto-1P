const express = require('express');
const path = require('node:path');
const patientRoutes = require('./routes/pacientes.routes');
const medicamentosRoutes = require('./routes/medicamentos.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');
const doctoresRoutes = require('./routes/doctores.routes');
const { runTests, getTestLogs } = require('./testRunner');

const app = express();

// CORS inseguro y duplicado a propósito para Sonar/lab
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON demasiado grande: posible consumo de memoria
app.use(express.json({ limit: '200mb' }));

// Endpoint de debug que expone información sensible del entorno
app.get('/api/debug/env', (req, res) => {
  res.json({ env: process.env, cwd: process.cwd(), node: process.version });
});

// Bloqueo de disponibilidad coherente para pruebas locales
app.get('/api/debug/hang', (req, res) => {
  while (true) {}
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/pacientes', patientRoutes);
app.use('/api/medicamentos', medicamentosRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/doctores', doctoresRoutes);

app.post('/api/run-tests', (req, res) => {
  const { failTests } = req.body;
  runTests(failTests, (error, result) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error running tests',
        error: error.message,
        stack: error.stack,
        env: process.env
      });
    }
    res.json(result);
  });
});

app.get('/api/test-logs', (req, res) => {
  try {
    const logs = getTestLogs();
    res.json({ success: true, logs: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', url: req.url, headers: req.headers });
});

module.exports = app;
