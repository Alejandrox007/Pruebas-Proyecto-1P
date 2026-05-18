const request = require('supertest');
const app = require('../src/app.js');

describe('Pacientes API', () => {
  // GET
  test('GET /api/pacientes should return an empty list initially', async () => {
    const res = await request(app).get('/api/pacientes');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);  // Vacía al inicio
  });

  // POST
  test('POST /api/pacientes should create a new patient', async () => {
    const newPatient = {
      name: 'Juan',
      lastName: 'Perez',
      email: 'juanperez@example.com',
      gender: 'Masculino',
      illness: 'Gripe'
    };

    const res = await request(app).post('/api/pacientes').send(newPatient);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Juan');
    expect(res.body.lastName).toBe('Perez');
  });

  // POST: No invalid data
  test('POST /api/pacientes should reject invalid data', async () => {
    const res = await request(app).post('/api/pacientes').send({ name: 'Carlos' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Name, Last Name, Email, Gender and Illness are required');
  });

});
