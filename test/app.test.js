const request = require('supertest');
const app = require('../src/app.js');

describe('App API - Main Endpoints', () => {
  
  // Test CORS middleware
  test('OPTIONS request - should allow CORS', async () => {
    const res = await request(app)
      .options('/api/pacientes')
      .set('Origin', 'http://example.com');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  // Test 404 handler
  test('GET /ruta-inexistente - should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });

  // Test /api/test-logs endpoint
  test('GET /api/test-logs - should return test logs', async () => {
    const res = await request(app).get('/api/test-logs');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  // Test static files serving
  test('GET / - should serve static files', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  // Test JSON parsing middleware
  test('POST /api/pacientes - should parse JSON body', async () => {
    const newPatient = {
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      gender: 'Masculino',
      illness: 'Test'
    };

    const res = await request(app).post('/api/pacientes').send(newPatient);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test');
  });

  // Test CORS headers
  test('GET /api/pacientes - should include CORS headers', async () => {
    const res = await request(app).get('/api/pacientes');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  // Test GET all medicamentos
  test('GET /api/medicamentos - should return medicamentos list', async () => {
    const res = await request(app).get('/api/medicamentos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test GET all especialidades
  test('GET /api/especialidades - should return especialidades list', async () => {
    const res = await request(app).get('/api/especialidades');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test GET all doctores
  test('GET /api/doctores - should return doctores list', async () => {
    const res = await request(app).get('/api/doctores');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test CORS with different methods
  test('GET /api/medicamentos - should have CORS headers', async () => {
    const res = await request(app).get('/api/medicamentos');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  // Test 404 on different route
  test('GET /api/ruta-invalida - should return 404', async () => {
    const res = await request(app).get('/api/ruta-invalida');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });

  // Test POST to invalid route
  test('POST /api/ruta-invalida - should return 404', async () => {
    const res = await request(app).post('/api/ruta-invalida').send({});
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });

  // Test JSON middleware with medicamentos
  test('POST /api/medicamentos - should parse JSON correctly', async () => {
    const newMed = {
      name: 'Test Med',
      description: 'Test Description',
      price: 10.50,
      quantity: 100,
      category: 'Test',
      laboratory: 'Test Lab'
    };

    const res = await request(app).post('/api/medicamentos').send(newMed);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Med');
  });

  // Test JSON middleware with especialidades
  test('POST /api/especialidades - should parse JSON correctly', async () => {
    const newSpec = { name: 'Test Specialty' };

    const res = await request(app).post('/api/especialidades').send(newSpec);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Specialty');
  });

  // Test JSON middleware with doctores
  test('POST /api/doctores - should parse JSON correctly', async () => {
    const newDoc = {
      name: 'Test',
      lastName: 'Doctor',
      specialty: 'Test Spec',
      phone: '1234567890',
      email: 'test@doctor.com',
      licenseNumber: 'TEST-123'
    };

    const res = await request(app).post('/api/doctores').send(newDoc);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test');
  });
});
