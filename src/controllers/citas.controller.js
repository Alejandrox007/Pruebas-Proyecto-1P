const db = require('../db');
const HttpError = require('../utils/http-error');

const selectAppointment = `
  SELECT c.id, c.paciente_id AS "patientId", c.doctor_id AS "doctorId",
         c.scheduled_at AS "scheduledAt", c.reason, c.status, c.notes,
         p.name || ' ' || p.last_name AS patient,
         d.name || ' ' || d.last_name AS doctor, s.name AS specialty
  FROM citas c
  JOIN pacientes p ON p.id=c.paciente_id
  JOIN doctores d ON d.id=c.doctor_id
  JOIN especialidades s ON s.id=d.specialty_id`;

async function roleProfile(user) {
  if (user.role === 'client') {
    const result = await db.query('SELECT id FROM pacientes WHERE user_id=$1', [Number(user.sub)]);
    return { patientId: result.rows[0]?.id };
  }
  if (user.role === 'doctor') {
    const result = await db.query('SELECT id FROM doctores WHERE user_id=$1', [Number(user.sub)]);
    return { doctorId: result.rows[0]?.id };
  }
  return {};
}

async function getAppointments(req, res) {
  const profile = await roleProfile(req.user);
  let where = '';
  let params = [];
  if (profile.patientId) {
    where = ' WHERE c.paciente_id=$1';
    params = [profile.patientId];
  } else if (profile.doctorId) {
    where = ' WHERE c.doctor_id=$1';
    params = [profile.doctorId];
  }
  const result = await db.query(`${selectAppointment}${where} ORDER BY c.scheduled_at`, params);
  res.json(result.rows);
}

function validateSchedule(value) {
  const date = new Date(value);
  if (date.getTime() < Date.now() + 2 * 60 * 60 * 1000) {
    throw new HttpError(400, 'Appointments must be scheduled at least two hours ahead');
  }
  const clinicDate = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  const day = clinicDate.getUTCDay();
  const hour = clinicDate.getUTCHours();
  const minute = clinicDate.getUTCMinutes();
  if (day === 0 || day === 6 || hour < 8 || hour >= 18 || ![0, 30].includes(minute)) {
    throw new HttpError(400, 'Appointments are Monday-Friday, 08:00-18:00, every 30 minutes');
  }
}

async function createAppointment(req, res) {
  validateSchedule(req.body.scheduledAt);
  const profile = await roleProfile(req.user);
  const patientId = profile.patientId || req.body.patientId;
  if (!patientId) throw new HttpError(400, 'patientId is required for administrators');

  const relations = await db.query(
    `SELECT
       EXISTS(SELECT 1 FROM pacientes WHERE id=$1) AS patient_exists,
       EXISTS(SELECT 1 FROM doctores WHERE id=$2 AND active=TRUE) AS doctor_exists`,
    [patientId, req.body.doctorId]
  );
  if (!relations.rows[0].patient_exists) throw new HttpError(400, 'Patient does not exist');
  if (!relations.rows[0].doctor_exists) throw new HttpError(400, 'Doctor does not exist or is inactive');

  const conflict = await db.query(
    `SELECT 1 FROM citas WHERE doctor_id=$1 AND scheduled_at=$2
     AND status <> 'cancelled'`,
    [req.body.doctorId, req.body.scheduledAt]
  );
  if (conflict.rowCount > 0) throw new HttpError(409, 'The doctor is not available at that time');

  const inserted = await db.query(
    `INSERT INTO citas (paciente_id, doctor_id, scheduled_at, reason)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [patientId, req.body.doctorId, req.body.scheduledAt, req.body.reason]
  );
  const created = await db.query(`${selectAppointment} WHERE c.id=$1`, [inserted.rows[0].id]);
  res.status(201).json(created.rows[0]);
}

async function updateAppointment(req, res) {
  const current = await db.query('SELECT * FROM citas WHERE id=$1', [req.params.id]);
  if (current.rowCount === 0) throw new HttpError(404, 'Appointment not found');
  const appointment = current.rows[0];
  const profile = await roleProfile(req.user);

  if (req.user.role === 'doctor' && profile.doctorId !== appointment.doctor_id) {
    throw new HttpError(403, 'This appointment is assigned to another doctor');
  }
  if (req.user.role === 'client') {
    if (profile.patientId !== appointment.paciente_id) {
      throw new HttpError(403, 'You can only manage your own appointments');
    }
    if (req.body.status !== 'cancelled') {
      throw new HttpError(403, 'Patients can only cancel appointments');
    }
  }

  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  if (!transitions[appointment.status].includes(req.body.status)) {
    throw new HttpError(409, `Cannot change ${appointment.status} to ${req.body.status}`);
  }

  await db.query(
    'UPDATE citas SET status=$1, notes=COALESCE($2, notes) WHERE id=$3',
    [req.body.status, req.body.notes ?? null, req.params.id]
  );
  const updated = await db.query(`${selectAppointment} WHERE c.id=$1`, [req.params.id]);
  res.json(updated.rows[0]);
}

module.exports = { createAppointment, getAppointments, roleProfile, updateAppointment, validateSchedule };
