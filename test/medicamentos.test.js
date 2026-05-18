const request = require('supertest');
const app = require('../src/app.js');

describe('Medicamentos API', () => {
  // GET
  test('GET /api/medicamentos should return an empty list initially', async () => {
    const res = await request(app).get('/api/medicamentos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);  // Vacía al inicio
  });

  // POST
  test('POST /api/medicamentos should create a new medicamento', async () => {
    const newMedicamento = {
      name: 'Paracetamol',
      description: 'Analgésico y antipirético'
    };

    const res = await request(app).post('/api/medicamentos').send(newMedicamento);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Paracetamol');
    expect(res.body.description).toBe('Analgésico y antipirético');
  });

  // POST: No invalid data
  test('POST /api/medicamentos should reject invalid data', async () => {
    const res = await request(app).post('/api/medicamentos').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Name is required');
  });


  
});