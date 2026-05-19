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

  // PUT
  test('PUT /api/pacientes/:id should update an existing patient', async () => {
    const patient = {
      name: 'Ana',
      lastName: 'Lopez',
      email: 'analopez@example.com',
      gender: 'Femenino',
      illness: 'Fiebre'
    };

    const anaLopez = await request(app).post('/api/pacientes').send(patient);
    const id = anaLopez.body.id;

    const updated = await request(app)
      .put(`/api/pacientes/${id}`)
      .send({ illness: 'Migraña' });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.illness).toBe('Migraña');
  });

  // PUT: Actualizar múltiples campos
  test('PUT /api/pacientes/:id should update multiple fields', async () => {
    const patient = {
      name: 'Pedro',
      lastName: 'Garcia',
      email: 'pedro@example.com',
      gender: 'Masculino',
      illness: 'Diabetes'
    };

    const pedroGarcia = await request(app).post('/api/pacientes').send(patient);
    const id = pedroGarcia.body.id;

    const updated = await request(app)
      .put(`/api/pacientes/${id}`)
      .send({ 
        name: 'Pedro Luis',
        lastName: 'Garcia Perez',
        email: 'pedroluis@example.com'
      });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.name).toBe('Pedro Luis');
    expect(updated.body.lastName).toBe('Garcia Perez');
    expect(updated.body.email).toBe('pedroluis@example.com');
    expect(updated.body.illness).toBe('Diabetes'); // No cambia
  });

  // DELETE
  test('DELETE /api/pacientes/:id should delete a patient', async () => {
    const patient = {
      name: 'Carlos',
      lastName: 'Perez',
      email: 'carlosperez@example.com',
      gender: 'Masculino',
      illness: 'Alergia'
    };

    const carlosPerez = await request(app).post('/api/pacientes').send(patient);
    const id = carlosPerez.body.id;

    const deleted = await request(app).delete(`/api/pacientes/${id}`);
    expect(deleted.statusCode).toBe(200);
    expect(deleted.body.name).toBe('Carlos');

    const res = await request(app).get('/api/pacientes');
    expect(res.body.find(p => p.id === id)).toBeUndefined();
  });

  // PUT: Paciente no encontrado
  test('PUT /api/pacientes/:id should return 404 if patient not found', async () => {
    const res = await request(app)
      .put('/api/pacientes/999999')
      .send({ illness: 'Gripe' });
    
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Patient not found');
  });

  // DELETE: Paciente no encontrado
  test('DELETE /api/pacientes/:id should return 404 if patient not found', async () => {
    const res = await request(app).delete('/api/pacientes/999999');
    
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Patient not found');
  });

  // Prueba que el manejador 404 funcione
  test('GET /ruta-inexistente - should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });
});
