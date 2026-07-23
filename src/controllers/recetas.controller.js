const db = require('../db');
const HttpError = require('../utils/http-error');
const { roleProfile } = require('./citas.controller');

async function getPrescriptions(req, res) {
  const profile = await roleProfile(req.user);
  let where = '';
  let params = [];
  if (profile.patientId) {
    where = ' WHERE r.paciente_id=$1';
    params = [profile.patientId];
  } else if (profile.doctorId) {
    where = ' WHERE r.doctor_id=$1';
    params = [profile.doctorId];
  }
  const prescriptions = await db.query(
    `SELECT r.id, r.cita_id AS "appointmentId", r.diagnosis, r.instructions,
            r.created_at AS "createdAt",
            p.name || ' ' || p.last_name AS patient,
            d.name || ' ' || d.last_name AS doctor
     FROM recetas r JOIN pacientes p ON p.id=r.paciente_id
     JOIN doctores d ON d.id=r.doctor_id${where} ORDER BY r.created_at DESC`,
    params
  );

  if (prescriptions.rowCount === 0) return res.json([]);
  const ids = prescriptions.rows.map((item) => item.id);
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  const items = await db.query(
    `SELECT rm.receta_id AS "prescriptionId", m.id AS "medicineId", m.name,
            rm.dosage, rm.frequency, rm.duration
     FROM receta_medicamentos rm JOIN medicamentos m ON m.id=rm.medicamento_id
     WHERE rm.receta_id IN (${placeholders}) ORDER BY m.name`,
    ids
  );
  const byPrescription = new Map();
  for (const item of items.rows) {
    const list = byPrescription.get(item.prescriptionId) || [];
    list.push(item);
    byPrescription.set(item.prescriptionId, list);
  }
  res.json(prescriptions.rows.map((item) => ({
    ...item,
    medications: byPrescription.get(item.id)
  })));
}

async function createPrescription(req, res) {
  const profile = await roleProfile(req.user);
  const appointment = await db.query(
    'SELECT id, doctor_id, paciente_id, status FROM citas WHERE id=$1',
    [req.body.appointmentId]
  );
  if (appointment.rowCount === 0) throw new HttpError(404, 'Appointment not found');
  const current = appointment.rows[0];
  if (profile.doctorId !== current.doctor_id) {
    throw new HttpError(403, 'Only the assigned doctor can create the prescription');
  }
  if (current.status !== 'completed') {
    throw new HttpError(409, 'The appointment must be completed first');
  }

  const medicineIds = req.body.medications.map((item) => item.medicineId);
  const placeholders = medicineIds.map((_, index) => `$${index + 1}`).join(',');
  const medicines = await db.query(
    `SELECT id FROM medicamentos WHERE id IN (${placeholders})`,
    medicineIds
  );
  if (medicines.rowCount !== medicineIds.length) {
    throw new HttpError(400, 'One or more medicines do not exist');
  }

  const prescription = await db.transaction(async (client) => {
    const created = await client.query(
      `INSERT INTO recetas
       (cita_id, doctor_id, paciente_id, diagnosis, instructions)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [current.id, current.doctor_id, current.paciente_id, req.body.diagnosis, req.body.instructions]
    );
    for (const item of req.body.medications) {
      await client.query(
        `INSERT INTO receta_medicamentos
         (receta_id, medicamento_id, dosage, frequency, duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [created.rows[0].id, item.medicineId, item.dosage, item.frequency, item.duration]
      );
    }
    return created.rows[0];
  });
  res.status(201).json({ id: prescription.id, ...req.body });
}

module.exports = { createPrescription, getPrescriptions };
