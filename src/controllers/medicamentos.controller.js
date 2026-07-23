const db = require('../db');
const HttpError = require('../utils/http-error');

async function getAllMedicamentos(req, res) {
  const search = req.query.search || '';
  const result = await db.query(
    `SELECT id, name, description FROM medicamentos
     WHERE LOWER(name) LIKE LOWER($1) ORDER BY name`,
    [`%${search}%`]
  );
  res.json(result.rows);
}

async function addNewMedicamento(req, res) {
  const result = await db.query(
    `INSERT INTO medicamentos (name, description)
     VALUES ($1, $2) RETURNING id, name, description`,
    [req.body.name, req.body.description ?? null]
  );
  res.status(201).json(result.rows[0]);
}

async function updateMedicamento(req, res) {
  const current = await db.query('SELECT * FROM medicamentos WHERE id=$1', [req.params.id]);
  if (current.rowCount === 0) throw new HttpError(404, 'Medicine not found');
  const result = await db.query(
    `UPDATE medicamentos SET name=$1, description=$2 WHERE id=$3
     RETURNING id, name, description`,
    [
      req.body.name ?? current.rows[0].name,
      req.body.description === undefined ? current.rows[0].description : req.body.description,
      req.params.id
    ]
  );
  res.json(result.rows[0]);
}

async function deleteMedicamento(req, res) {
  const result = await db.query(
    'DELETE FROM medicamentos WHERE id=$1 RETURNING id, name, description',
    [req.params.id]
  );
  if (result.rowCount === 0) throw new HttpError(404, 'Medicine not found');
  res.json(result.rows[0]);
}

module.exports = { addNewMedicamento, deleteMedicamento, getAllMedicamentos, updateMedicamento };
