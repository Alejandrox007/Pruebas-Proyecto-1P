process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const strongPassword = 'SecurePass1!';
let adminToken;
let clientToken;
let secondClientToken;
let doctorToken;
let secondDoctorToken;
let specialtyId;
let doctorId;
let medicineId;
let clientId;
let secondClientId;
let appointmentId;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function clinicDate(daysAhead = 4, hour = 10, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  date.setUTCHours(hour + 5, minute, 0, 0);
  while ([0, 6].includes(new Date(date.getTime() - 5 * 3600000).getUTCDay())) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString();
}

async function register(email, name = 'Ana', includeBirthDate = true) {
  return request(app).post('/api/auth/register').send({
    name,
    lastName: 'Pérez',
    email,
    password: strongPassword,
    phone: '+593999999999',
    gender: 'Femenino',
    ...(includeBirthDate ? { birthDate: '2000-05-10' } : {})
  });
}

beforeAll(async () => {
  await db.initialize();
  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@hospital.local',
    password: 'ChangeMe123!'
  });
  adminToken = login.body.token;
});

afterAll(async () => {
  await db.pool.end();
});

describe('security, routing and authentication', () => {
  test('health, CORS preflight and security headers work', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.headers['x-powered-by']).toBeUndefined();
    expect(health.headers['x-content-type-options']).toBe('nosniff');

    const preflight = await request(app).options('/api/health')
      .set('Origin', 'http://localhost:4200');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('http://localhost:4200');

    const forbidden = await request(app).get('/api/health').set('Origin', 'https://evil.test');
    expect(forbidden.status).toBe(403);
  });

  test('rejects missing, malformed and invalid authentication', async () => {
    expect((await request(app).get('/api/doctores')).status).toBe(401);
    expect((await request(app).get('/api/doctores').set('Authorization', 'Basic bad')).status).toBe(401);
    expect((await request(app).get('/api/doctores').set(auth('invalid.token'))).status).toBe(401);
  });

  test('validates login and registration inputs', async () => {
    const invalid = await request(app).post('/api/auth/register').send({
      name: 'A1', lastName: '!', email: 'bad', password: 'weak', phone: 'abc', gender: 'X'
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errors.length).toBeGreaterThan(1);

    const malformed = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{"email":');
    expect(malformed.status).toBe(400);

    const wrong = await request(app).post('/api/auth/login').send({
      email: 'missing@example.com', password: 'wrong'
    });
    expect(wrong.status).toBe(401);
  });

  test('registers only clients, prevents duplicates, logs in and returns identity', async () => {
    const first = await register('ana@example.com');
    expect(first.status).toBe(201);
    expect(first.body.user.role).toBe('client');
    clientToken = first.body.token;
    clientId = first.body.profile.id;

    expect((await register('ana@example.com')).status).toBe(409);
    expect((await request(app).post('/api/auth/login').send({
      email: 'ana@example.com', password: 'WrongPass1!'
    })).status).toBe(401);

    const login = await request(app).post('/api/auth/login').send({
      email: 'ANA@example.com', password: strongPassword
    });
    expect(login.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set(auth(login.body.token));
    expect(me.body).toMatchObject({ email: 'ana@example.com', role: 'client' });

    const second = await register('maria@example.com', 'María', false);
    secondClientToken = second.body.token;
    secondClientId = second.body.profile.id;
  });

  test('returns controlled 404 responses', async () => {
    const response = await request(app).get('/api/does-not-exist').set(auth(adminToken));
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('API route not found');
  });
});

describe('administrator catalog and account rules', () => {
  test('only administrators can write specialties', async () => {
    expect((await request(app).post('/api/especialidades').set(auth(clientToken))
      .send({ name: 'Cardiología' })).status).toBe(403);

    const created = await request(app).post('/api/especialidades').set(auth(adminToken))
      .send({ name: 'Cardiología', description: 'Salud cardiovascular' });
    expect(created.status).toBe(201);
    specialtyId = created.body.id;

    expect((await request(app).post('/api/especialidades').set(auth(adminToken))
      .send({ name: 'Cardiología' })).status).toBe(409);
    expect((await request(app).get('/api/especialidades').set(auth(clientToken))).body).toHaveLength(1);
    expect((await request(app).put('/api/especialidades/999').set(auth(adminToken))
      .send({ name: 'Neurología' })).status).toBe(404);
    expect((await request(app).delete('/api/especialidades/999').set(auth(adminToken))).status).toBe(404);
  });

  test('manages medicines and validates identifiers and queries', async () => {
    expect((await request(app).get('/api/medicamentos').set(auth(clientToken))).status).toBe(403);
    expect((await request(app).post('/api/medicamentos').set(auth(adminToken))
      .send({ name: '@@@' })).status).toBe(400);

    const created = await request(app).post('/api/medicamentos').set(auth(adminToken))
      .send({ name: 'Paracetamol 500mg', description: 'Analgésico' });
    expect(created.status).toBe(201);
    medicineId = created.body.id;

    const found = await request(app).get('/api/medicamentos?search=para').set(auth(adminToken));
    expect(found.body[0].name).toBe('Paracetamol 500mg');
    expect((await request(app).get('/api/medicamentos').set(auth(adminToken))).body).toHaveLength(1);
    expect((await request(app).get(`/api/medicamentos?search=${'a'.repeat(101)}`)
      .set(auth(adminToken))).status).toBe(400);

    const updated = await request(app).put(`/api/medicamentos/${medicineId}`).set(auth(adminToken))
      .send({ description: null });
    expect(updated.body.description).toBeNull();
    expect((await request(app).put(`/api/medicamentos/${medicineId}`).set(auth(adminToken))
      .send({ name: 'Paracetamol 500mg' })).status).toBe(200);
    expect((await request(app).put('/api/medicamentos/nope').set(auth(adminToken))
      .send({ name: 'Aspirina' })).status).toBe(400);
    expect((await request(app).put('/api/medicamentos/999').set(auth(adminToken))
      .send({ name: 'Aspirina' })).status).toBe(404);
    expect((await request(app).delete('/api/medicamentos/999').set(auth(adminToken))).status).toBe(404);

    const temporary = await request(app).post('/api/medicamentos').set(auth(adminToken))
      .send({ name: 'Aspirina', description: null });
    expect((await request(app).delete(`/api/medicamentos/${temporary.body.id}`)
      .set(auth(adminToken))).status).toBe(200);
  });

  test('only admin creates doctor accounts and updates doctors', async () => {
    const payload = {
      name: 'Juan',
      lastName: 'Gómez',
      specialtyId,
      phone: '+593988888888',
      email: 'doctor@example.com',
      licenseNumber: 'MED-1001',
      initialPassword: strongPassword
    };
    expect((await request(app).post('/api/doctores').set(auth(clientToken)).send(payload)).status).toBe(403);
    expect((await request(app).post('/api/doctores').set(auth(adminToken))
      .send({ ...payload, specialtyId: 999 })).status).toBe(400);

    const created = await request(app).post('/api/doctores').set(auth(adminToken)).send(payload);
    expect(created.status).toBe(201);
    doctorId = created.body.id;

    const login = await request(app).post('/api/auth/login')
      .send({ email: payload.email, password: payload.initialPassword });
    expect(login.status).toBe(200);
    doctorToken = login.body.token;

    expect((await request(app).put('/api/doctores/999').set(auth(adminToken))
      .send({ phone: '+593977777777' })).status).toBe(404);
    expect((await request(app).put(`/api/doctores/${doctorId}`).set(auth(adminToken))
      .send({ specialtyId: 999 })).status).toBe(400);

    const updated = await request(app).put(`/api/doctores/${doctorId}`).set(auth(adminToken))
      .send({ email: 'doctor.updated@example.com', phone: '+593977777777' });
    expect(updated.body.email).toBe('doctor.updated@example.com');
    expect((await request(app).put(`/api/doctores/${doctorId}`).set(auth(adminToken))
      .send({ phone: '+593955555555' })).status).toBe(200);
    expect((await request(app).get('/api/doctores').set(auth(clientToken))).body[0].id).toBe(doctorId);

    const second = await request(app).post('/api/doctores').set(auth(adminToken)).send({
      ...payload,
      email: 'second.doctor@example.com',
      phone: '+593944444444',
      licenseNumber: 'MED-1002'
    });
    const secondLogin = await request(app).post('/api/auth/login')
      .send({ email: 'second.doctor@example.com', password: strongPassword });
    secondDoctorToken = secondLogin.body.token;
    expect(second.status).toBe(201);
    expect((await request(app).get('/api/pacientes').set(auth(secondDoctorToken))).body).toEqual([]);
  });

  test('protects specialties assigned to doctors and exposes admin summary', async () => {
    expect((await request(app).delete(`/api/especialidades/${specialtyId}`)
      .set(auth(adminToken))).status).toBe(409);
    const summary = await request(app).get('/api/admin/summary').set(auth(adminToken));
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({ doctors: 2, patients: 2 });
    expect((await request(app).get('/api/admin/summary').set(auth(clientToken))).status).toBe(403);

    const temporary = await request(app).post('/api/especialidades').set(auth(adminToken))
      .send({ name: 'Neurología' });
    const renamed = await request(app).put(`/api/especialidades/${temporary.body.id}`)
      .set(auth(adminToken)).send({ name: 'Dermatología', description: null });
    expect(renamed.body.name).toBe('Dermatología');
    expect((await request(app).delete(`/api/especialidades/${temporary.body.id}`)
      .set(auth(adminToken))).status).toBe(200);
  });
});

describe('patients and appointment business rules', () => {
  test('scopes patient visibility and profile updates', async () => {
    const own = await request(app).get('/api/pacientes').set(auth(clientToken));
    expect(own.body).toHaveLength(1);
    expect(own.body[0].id).toBe(clientId);

    expect((await request(app).put(`/api/pacientes/${secondClientId}`).set(auth(clientToken))
      .send({ illness: 'Migraña' })).status).toBe(403);
    expect((await request(app).put('/api/pacientes/999').set(auth(adminToken))
      .send({ illness: 'Migraña' })).status).toBe(404);
    const update = await request(app).put(`/api/pacientes/${clientId}`).set(auth(clientToken))
      .send({
        name: 'Anita',
        lastName: 'Pérez López',
        phone: '+593966666666',
        gender: 'Otro',
        birthDate: null,
        illness: 'Migraña'
      });
    expect(update.body.illness).toBe('Migraña');
    expect((await request(app).get('/api/pacientes').set(auth(adminToken))).body).toHaveLength(2);
  });

  test('rejects invalid schedules and missing relations', async () => {
    const past = await request(app).post('/api/citas').set(auth(clientToken)).send({
      doctorId, scheduledAt: new Date().toISOString(), reason: 'Consulta general'
    });
    expect(past.status).toBe(400);

    const weekend = new Date(clinicDate());
    const delta = (6 - new Date(weekend.getTime() - 5 * 3600000).getUTCDay() + 7) % 7;
    weekend.setUTCDate(weekend.getUTCDate() + delta);
    expect((await request(app).post('/api/citas').set(auth(clientToken)).send({
      doctorId, scheduledAt: weekend.toISOString(), reason: 'Consulta general'
    })).status).toBe(400);

    expect((await request(app).post('/api/citas').set(auth(adminToken)).send({
      doctorId, scheduledAt: clinicDate(7), reason: 'Consulta general'
    })).status).toBe(400);
    expect((await request(app).post('/api/citas').set(auth(adminToken)).send({
      doctorId: 999, patientId: clientId, scheduledAt: clinicDate(8), reason: 'Consulta general'
    })).status).toBe(400);
    expect((await request(app).post('/api/citas').set(auth(adminToken)).send({
      doctorId, patientId: 999, scheduledAt: clinicDate(8), reason: 'Consulta general'
    })).status).toBe(400);
  });

  test('books, scopes and protects appointments', async () => {
    const scheduledAt = clinicDate(5);
    const created = await request(app).post('/api/citas').set(auth(clientToken)).send({
      doctorId, scheduledAt, reason: 'Dolor de cabeza persistente'
    });
    expect(created.status).toBe(201);
    appointmentId = created.body.id;

    expect((await request(app).post('/api/citas').set(auth(secondClientToken)).send({
      doctorId, scheduledAt, reason: 'Control médico preventivo'
    })).status).toBe(409);

    expect((await request(app).get('/api/citas').set(auth(clientToken))).body).toHaveLength(1);
    expect((await request(app).get('/api/citas').set(auth(doctorToken))).body).toHaveLength(1);
    expect((await request(app).get('/api/citas').set(auth(adminToken))).body).toHaveLength(1);

    const doctorPatients = await request(app).get('/api/pacientes').set(auth(doctorToken));
    expect(doctorPatients.body[0].id).toBe(clientId);
    expect((await request(app).delete(`/api/pacientes/${clientId}`)
      .set(auth(adminToken))).status).toBe(409);
    expect((await request(app).delete(`/api/doctores/${doctorId}`)
      .set(auth(adminToken))).status).toBe(409);
  });

  test('enforces appointment ownership and state transitions', async () => {
    expect((await request(app).patch('/api/citas/999').set(auth(adminToken))
      .send({ status: 'confirmed' })).status).toBe(404);
    expect((await request(app).patch(`/api/citas/${appointmentId}`).set(auth(secondClientToken))
      .send({ status: 'cancelled' })).status).toBe(403);
    expect((await request(app).patch(`/api/citas/${appointmentId}`).set(auth(secondDoctorToken))
      .send({ status: 'confirmed' })).status).toBe(403);
    expect((await request(app).patch(`/api/citas/${appointmentId}`).set(auth(clientToken))
      .send({ status: 'confirmed' })).status).toBe(403);

    const confirmed = await request(app).patch(`/api/citas/${appointmentId}`).set(auth(doctorToken))
      .send({ status: 'confirmed', notes: 'Paciente confirmado' });
    expect(confirmed.body.status).toBe('confirmed');
    expect((await request(app).patch(`/api/citas/${appointmentId}`).set(auth(doctorToken))
      .send({ status: 'confirmed' })).status).toBe(409);

    const cancellable = await request(app).post('/api/citas').set(auth(clientToken)).send({
      doctorId, scheduledAt: clinicDate(6, 11, 30), reason: 'Cita para cancelar'
    });
    expect((await request(app).patch(`/api/citas/${cancellable.body.id}`).set(auth(clientToken))
      .send({ status: 'cancelled' })).status).toBe(200);
  });
});

describe('prescription workflow', () => {
  test('requires an assigned doctor and completed appointment', async () => {
    const prescription = {
      appointmentId,
      diagnosis: 'Migraña',
      instructions: 'Descanso e hidratación',
      medications: [{ medicineId, dosage: '500 mg', frequency: 'Cada 8 horas', duration: '3 días' }]
    };
    expect((await request(app).post('/api/recetas').set(auth(clientToken)).send(prescription)).status).toBe(403);
    expect((await request(app).post('/api/recetas').set(auth(doctorToken))
      .send({ ...prescription, appointmentId: 999 })).status).toBe(404);
    expect((await request(app).post('/api/recetas').set(auth(doctorToken)).send(prescription)).status).toBe(409);

    const completed = await request(app).patch(`/api/citas/${appointmentId}`).set(auth(doctorToken))
      .send({ status: 'completed' });
    expect(completed.body.status).toBe('completed');
    expect((await request(app).post('/api/recetas').set(auth(secondDoctorToken))
      .send(prescription)).status).toBe(403);

    expect((await request(app).post('/api/recetas').set(auth(doctorToken)).send({
      ...prescription,
      medications: [{ ...prescription.medications[0], medicineId: 999 }]
    })).status).toBe(400);
    expect((await request(app).post('/api/recetas').set(auth(doctorToken)).send({
      ...prescription,
      medications: [prescription.medications[0], prescription.medications[0]]
    })).status).toBe(400);

    const created = await request(app).post('/api/recetas').set(auth(doctorToken)).send(prescription);
    expect(created.status).toBe(201);
  });

  test('scopes prescription lists and handles empty lists', async () => {
    const patientList = await request(app).get('/api/recetas').set(auth(clientToken));
    expect(patientList.body[0].medications[0].name).toBe('Paracetamol 500mg');
    expect((await request(app).get('/api/recetas').set(auth(doctorToken))).body).toHaveLength(1);
    expect((await request(app).get('/api/recetas').set(auth(adminToken))).body).toHaveLength(1);
    expect((await request(app).get('/api/recetas').set(auth(secondClientToken))).body).toEqual([]);
    const deletedPatient = await request(app).delete(`/api/pacientes/${secondClientId}`).set(auth(adminToken));
    expect(deletedPatient.status).toBe(200);
    expect((await request(app).delete('/api/pacientes/999').set(auth(adminToken))).status).toBe(404);
  });

  test('allows cleanup after appointments finish and disables doctor login', async () => {
    const deleted = await request(app).delete(`/api/doctores/${doctorId}`).set(auth(adminToken));
    expect(deleted.status).toBe(200);
    expect(deleted.body.active).toBe(false);
    expect((await request(app).post('/api/auth/login').send({
      email: 'doctor.updated@example.com', password: strongPassword
    })).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth(doctorToken))).status).toBe(401);

    expect((await request(app).delete('/api/doctores/999').set(auth(adminToken))).status).toBe(404);
  });
});
