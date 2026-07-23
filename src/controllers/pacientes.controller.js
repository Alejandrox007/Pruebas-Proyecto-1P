const db = require('../db');
const HttpError = require('../utils/http-error');

const selectPatient = `
  SELECT id, user_id AS "userId", name, last_name AS "lastName", email,
         phone, gender, birth_date AS "birthDate", illness
  FROM pacientes`;

async function getAllPatients(req, res) {
  let result;
  if (req.user.role === 'client') {
    result = await db.query(`${selectPatient} WHERE user_id=$1`, [Number(req.user.sub)]);
  } else if (req.user.role === 'doctor') {
    result = await db.query(
      `${selectPatient} WHERE id IN (
        SELECT DISTINCT c.paciente_id FROM citas c
        JOIN doctores d ON d.id=c.doctor_id WHERE d.user_id=$1
      ) ORDER BY id`,
      [Number(req.user.sub)]
    );
  } else {
    result = await db.query(`${selectPatient} ORDER BY id`);
  }
  res.json(result.rows);
}

async function updatePatient(req, res) {
  const result = await db.query(`${selectPatient} WHERE id=$1`, [req.params.id]);
  if (result.rowCount === 0) throw new HttpError(404, 'Patient not found');
  const current = result.rows[0];
  if (req.user.role === 'client' && current.userId !== Number(req.user.sub)) {
    throw new HttpError(403, 'You can only update your own profile');
  }

  const updated = await db.query(
    `UPDATE pacientes SET name=COALESCE($1, name), last_name=COALESCE($2, last_name),
     phone=COALESCE($3, phone), gender=COALESCE($4, gender),
     birth_date=CASE WHEN $5::boolean THEN $6 ELSE birth_date END,
     illness=COALESCE($7, illness) WHERE id=$8
     RETURNING id, user_id AS "userId", name, last_name AS "lastName", email,
               phone, gender, birth_date AS "birthDate", illness`,
    [
      req.body.name,
      req.body.lastName,
      req.body.phone,
      req.body.gender,
      Object.hasOwn(req.body, 'birthDate'),
      req.body.birthDate,
      req.body.illness,
      req.params.id
    ]
  );
  res.json(updated.rows[0]);
}

async function deletePatient(req, res) {
  const active = await db.query(
    `SELECT 1 FROM citas WHERE paciente_id=$1 AND scheduled_at > NOW()
     AND status IN ('pending', 'confirmed') LIMIT 1`,
    [req.params.id]
  );
  if (active.rowCount > 0) throw new HttpError(409, 'Patient has upcoming appointments');
  const deleted = await db.query(`${selectPatient} WHERE id=$1`, [req.params.id]);
  if (deleted.rowCount === 0) throw new HttpError(404, 'Patient not found');
  await db.query('DELETE FROM usuarios WHERE id=$1', [deleted.rows[0].userId]);
  res.json(deleted.rows[0]);
}

module.exports = { deletePatient, getAllPatients, updatePatient };
