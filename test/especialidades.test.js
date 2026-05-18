const request = require('supertest');
const app = require('../src/app.js');

describe('Especialidades API', () => {

  // GET
  test('GET /api/especialidades should return an empty list initially', async () => {
    const res = await request(app).get('/api/especialidades');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);  // Vacía al inicio
  });

  // POST
  test('POST /api/especialidades should create a new specialty', async () => {
    const newSpecialty = { name: 'Medicina General' };

    const res = await request(app).post('/api/especialidades').send(newSpecialty);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Medicina General');
  });

  // POST invalid data
  test('POST /api/especialidades should reject invalid data', async () => {
    const res = await request(app).post('/api/especialidades').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Specialty name is required');
  });





  
});