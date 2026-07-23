const db = require('../db');
const HttpError = require('../utils/http-error');

async function getAllSpecialties(req, res) {
  const result = await db.query('SELECT id, name, description FROM especialidades ORDER BY name');
  res.json(result.rows);
}

async function addnewSpecialty(req, res) {
  const result = await db.query(
    'INSERT INTO especialidades (name, description) VALUES ($1, $2) RETURNING id, name, description',
    [req.body.name, req.body.description ?? null]
  );
  res.status(201).json(result.rows[0]);
}

async function updateSpecialty(req, res) {
  const result = await db.query(
    'UPDATE especialidades SET name=$1, description=$2 WHERE id=$3 RETURNING id, name, description',
    [req.body.name, req.body.description ?? null, req.params.id]
  );
  if (result.rowCount === 0) throw new HttpError(404, 'Specialty not found');
  res.json(result.rows[0]);
}

async function deleteSpecialty(req, res) {
  const used = await db.query('SELECT 1 FROM doctores WHERE specialty_id=$1 LIMIT 1', [req.params.id]);
  if (used.rowCount > 0) throw new HttpError(409, 'Specialty is assigned to a doctor');
  const result = await db.query(
    'DELETE FROM especialidades WHERE id=$1 RETURNING id, name, description',
    [req.params.id]
  );
  if (result.rowCount === 0) throw new HttpError(404, 'Specialty not found');
  res.json(result.rows[0]);
}

module.exports = { addnewSpecialty, deleteSpecialty, getAllSpecialties, updateSpecialty };
