const request = require('supertest');
const app = require('../src/app');

describe('Doctors API', () => {
  let doctorId;
  let specialtyId;

  async function ensureSpecialty(name) {
    const created = await request(app).post('/api/especialidades').send({ name });
    if (created.statusCode === 201) return created.body.id;

    const list = await request(app).get('/api/especialidades');
    const found = list.body.find(item => item.name.toLowerCase() === name.toLowerCase());
    return found ? found.id : null;
  }

  beforeAll(async () => {
    specialtyId = await ensureSpecialty('Cardiologia');
  });

  // Test GET - list doctors (initially empty)
  test('GET /api/doctores - should return empty array initially', async () => {
    const response = await request(app).get('/api/doctores');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  // Test POST - create doctor
  test('POST /api/doctores - should create a new doctor', async () => {
    const newDoctor = {
      name: 'Carlos',
      lastName: 'Ramírez',
      specialtyId,
      phone: '0987654321',
      email: 'carlos.ramirez@hospital.com',
      licenseNumber: 'LIC-12345'
    };

    const response = await request(app)
      .post('/api/doctores')
      .send(newDoctor);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Carlos');
    expect(response.body.lastName).toBe('Ramírez');
    expect(response.body.specialtyId).toBe(specialtyId);
    expect(response.body.licenseNumber).toBe('LIC-12345');

    doctorId = response.body.id;
  });

  // Test POST - required fields validation
  test('POST /api/doctores - should return 400 error if fields are missing', async () => {
    const incompleteDoctor = {
      name: 'Maria',
      lastName: 'Gonzalez'
      // Missing: specialty, phone, email, licenseNumber
    };

    const response = await request(app)
      .post('/api/doctores')
      .send(incompleteDoctor);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  // Test POST - Duplicate license number validation
  test('POST /api/doctores - should return 409 error if license number already exists', async () => {
    const duplicateDoctor = {
      name: 'Pedro',
      lastName: 'Sánchez',
      specialtyId,
      phone: '0998765432',
      email: 'pedro.sanchez@hospital.com',
      licenseNumber: 'LIC-12345' // Same license number
    };

    const response = await request(app)
      .post('/api/doctores')
      .send(duplicateDoctor);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A doctor with this license number already exists');
  });

  test('should return 409 if license number already exists in another doctor', async () => {
    const doctor1 = await request(app).post('/api/doctores').send({
      name: 'John',
      lastName: 'Doe',
      specialtyId,
      phone: '1234567890',
      email: 'john@example.com',
      licenseNumber: 'LIC-001'
    });

    const doctor2 = await request(app).post('/api/doctores').send({
      name: 'Jane',
      lastName: 'Smith',
      specialtyId,
      phone: '0987654321',
      email: 'jane@example.com',
      licenseNumber: 'LIC-002'
    });

    const res = await request(app)
      .put(`/api/doctores/${doctor2.body.id}`)
      .send({ licenseNumber: 'LIC-001' });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'A doctor with this license number already exists');
  });

  test('should allow updating doctor with same license number', async () => {
    const doctor = await request(app).post('/api/doctores').send({
      name: 'John',
      lastName: 'Doe',
      specialtyId,
      phone: '1234567890',
      email: 'john@example.com',
      licenseNumber: 'LIC-00001'
    });

    const res = await request(app)
      .put(`/api/doctores/${doctor.body.id}`)
      .send({ 
        name: 'John Updated',
        licenseNumber: 'LIC-00001' 
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('licenseNumber', 'LIC-00001');
    expect(res.body).toHaveProperty('name', 'John Updated');
  });

  // Test GET - List doctors (after creating one)
  test('GET /api/doctores - should return array with doctors', async () => {
    const response = await request(app).get('/api/doctores');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test PUT - Update doctor
  test('PUT /api/doctores/:id - should update an existing doctor', async () => {
    const updatedData = {
      phone: '0912345678'
    };

    const response = await request(app)
      .put(`/api/doctores/${doctorId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.phone).toBe('0912345678');
    expect(response.body.name).toBe('Carlos'); // Should not change
  });

  // Test PUT - Doctor not found
  test('PUT /api/doctores/:id - should return 404 if doctor does not exist', async () => {
    const response = await request(app)
      .put('/api/doctores/999999')
      .send({ specialty: 'Dermatología' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Doctor not found');
  });

  // Test DELETE - Delete doctor
  test('DELETE /api/doctores/:id - should delete an existing doctor', async () => {
    const response = await request(app).delete(`/api/doctores/${doctorId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(doctorId);
  });

  // Test DELETE - Doctor not found
  test('DELETE /api/doctores/:id - should return 404 if doctor does not exist', async () => {
    const response = await request(app).delete('/api/doctores/999999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Doctor not found');
  });
});
