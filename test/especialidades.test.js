const request = require('supertest');
const app = require('../src/app.js');

describe('Especialidades API', () => {

  // GET
  test('GET /api/especialidades should return an empty list initially', async () => {
    const res = await request(app).get('/api/especialidades');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.any(Array));  // Vacía al inicio
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

  test('should reject duplicate specialty', async () => {
    await request(app).post('/api/especialidades').send({ name: 'Cardiology' });

    const res = await request(app).post('/api/especialidades').send({ name: 'cardiology' });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'Specialty already exists');
  });

  // PUT
  test('PUT /api/especialidades/:id should update an existing specialty', async () => {
    const specialty = { name: 'Oftalmología' };
    const created = await request(app).post('/api/especialidades').send(specialty);
    const id = created.body.id;

    const updated = await request(app)
      .put(`/api/especialidades/${id}`)
      .send({ name: 'Oftalmología Corregida' });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.name).toBe('Oftalmología Corregida');
  });

  // PUT: Especialidad no encontrada
  test('PUT /api/especialidades/:id should return 404 if specialty not found', async () => {
    const res = await request(app)
      .put('/api/especialidades/999999')
      .send({ name: 'Dermatología' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Specialty not found');
  });

  // test('PUT /api/especialidades/:id should return 400 if name is not provided', async () => {
  //   const createRes = await request(app).post('/api/especialidades').send({ name: 'Medicina General' });
  //   const specialtyId = createRes.body.id;
    
  //   const res = await request(app).put(`/api/especialidades/${specialtyId}`).send({});
    
  //   expect(res.statusCode).toBe(400);
  //   expect(res.body).toHaveProperty('message', 'Name is required to update Specialty');
  // });

  // DELETE
  test('DELETE /api/especialidades/:id should delete a specialty', async () => {
    const specialty = { name: 'Cardiología' };
    const created = await request(app).post('/api/especialidades').send(specialty);
    const id = created.body.id;

    const deleted = await request(app).delete(`/api/especialidades/${id}`);
    expect(deleted.statusCode).toBe(200);
    expect(deleted.body.name).toBe('Cardiología');

    const res = await request(app).get('/api/especialidades');
    expect(res.body.find(e => e.id === id)).toBeUndefined();
  });

  // DELETE: Especialidad no encontrada
  test('DELETE /api/especialidades/:id should return 404 if specialty not found', async () => {
    const res = await request(app).delete('/api/especialidades/999999');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Specialty not found');
  });

  // 404 
  test('GET /ruta-inexistente - should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });

  
});