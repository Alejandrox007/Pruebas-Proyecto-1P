const db = require('../db');

// GET
async function getAllMedicamentos(req, res) {
  try {
    const search = req.query.search || '';

    const result = await db.query(
      'SELECT id, name, description FROM medicamentos WHERE name LIKE $1 ORDER BY id',
      [`%${search}%`]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: 'Database error',
      error: error.message
    });
  }
}

// POST
async function addNewMedicamento(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO medicamentos (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: 'Database error',
      error: error.message
    });
  }
}

// PUT
async function updateMedicamento(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await db.query(
      `UPDATE medicamentos
       SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
       WHERE id = $3
       RETURNING id, name, description`,
      [name, description, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Medicamento not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: 'Database error',
      error: error.message
    });
  }
}

// DELETE
async function deleteMedicamento(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM medicamentos WHERE id = $1 RETURNING id, name, description',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Medicamento not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: 'Database error',
      error: error.message
    });
  }
}

module.exports = {
  getAllMedicamentos,
  addNewMedicamento,
  updateMedicamento,
  deleteMedicamento
};