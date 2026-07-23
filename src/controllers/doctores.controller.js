const bcrypt = require('bcryptjs');
const db = require('../db');
const HttpError = require('../utils/http-error');

const selectDoctor = `
  SELECT d.id, d.name, d.last_name AS "lastName",
         d.specialty_id AS "specialtyId", s.name AS specialty,
         d.phone, d.email, d.license_number AS "licenseNumber", d.active
  FROM doctores d JOIN especialidades s ON s.id = d.specialty_id`;

async function getAllDoctors(req, res) {
  const result = await db.query(`${selectDoctor} ORDER BY d.id`);
  res.json(result.rows);
}

async function addNewDoctor(req, res) {
  const { name, lastName, specialtyId, phone, email, licenseNumber, initialPassword } = req.body;
  const specialty = await db.query('SELECT 1 FROM especialidades WHERE id = $1', [specialtyId]);
  if (specialty.rowCount === 0) throw new HttpError(400, 'Specialty does not exist');

  const passwordHash = await bcrypt.hash(initialPassword, 12);
  const doctorId = await db.transaction(async (client) => {
    const user = await client.query(
      `INSERT INTO usuarios (email, password_hash, role)
       VALUES ($1, $2, 'doctor') RETURNING id`,
      [email, passwordHash]
    );
    const doctor = await client.query(
      `INSERT INTO doctores
       (user_id, name, last_name, specialty_id, phone, email, license_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user.rows[0].id, name, lastName, specialtyId, phone, email, licenseNumber]
    );
    return doctor.rows[0].id;
  });
  const created = await db.query(`${selectDoctor} WHERE d.id = $1`, [doctorId]);
  res.status(201).json(created.rows[0]);
}

async function updateDoctor(req, res) {
  const current = await db.query('SELECT * FROM doctores WHERE id = $1', [req.params.id]);
  if (current.rowCount === 0) throw new HttpError(404, 'Doctor not found');

  const doctor = current.rows[0];
  const next = {
    name: req.body.name ?? doctor.name,
    lastName: req.body.lastName ?? doctor.last_name,
    specialtyId: req.body.specialtyId ?? doctor.specialty_id,
    phone: req.body.phone ?? doctor.phone,
    email: req.body.email ?? doctor.email,
    licenseNumber: req.body.licenseNumber ?? doctor.license_number
  };

  const specialty = await db.query('SELECT 1 FROM especialidades WHERE id = $1', [next.specialtyId]);
  if (specialty.rowCount === 0) throw new HttpError(400, 'Specialty does not exist');

  await db.transaction(async (client) => {
    await client.query(
      `UPDATE doctores SET name=$1, last_name=$2, specialty_id=$3, phone=$4,
       email=$5, license_number=$6 WHERE id=$7`,
      [next.name, next.lastName, next.specialtyId, next.phone, next.email, next.licenseNumber, req.params.id]
    );
    if (next.email !== doctor.email) {
      await client.query('UPDATE usuarios SET email=$1 WHERE id=$2', [next.email, doctor.user_id]);
    }
  });
  const updated = await db.query(`${selectDoctor} WHERE d.id = $1`, [req.params.id]);
  res.json(updated.rows[0]);
}

async function deleteDoctor(req, res) {
  const current = await db.query(`${selectDoctor} WHERE d.id = $1`, [req.params.id]);
  if (current.rowCount === 0) throw new HttpError(404, 'Doctor not found');

  const futureAppointments = await db.query(
    `SELECT 1 FROM citas WHERE doctor_id=$1 AND scheduled_at > NOW()
     AND status IN ('pending', 'confirmed') LIMIT 1`,
    [req.params.id]
  );
  if (futureAppointments.rowCount > 0) {
    throw new HttpError(409, 'Doctor has upcoming appointments');
  }

  await db.transaction(async (client) => {
    await client.query('UPDATE doctores SET active=FALSE WHERE id=$1', [req.params.id]);
    await client.query(
      'UPDATE usuarios SET active=FALSE WHERE id=(SELECT user_id FROM doctores WHERE id=$1)',
      [req.params.id]
    );
  });
  res.json({ ...current.rows[0], active: false });
}

module.exports = { addNewDoctor, deleteDoctor, getAllDoctors, updateDoctor };
