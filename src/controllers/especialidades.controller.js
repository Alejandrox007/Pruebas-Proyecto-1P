// CRUD DE ESPECIALIDADES

const db = require('../db');

// GET listar
async function getAllSpecialties(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name FROM especialidades ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// POST agregar
async function addnewSpecialty(req, res) {
  const { name } = req.body;

  // Validación de entrada
  if (!name) {
    return res.status(400).json({ message: 'Specialty name is required' });
  }

  try {
    const duplicate = await db.query(
      'SELECT 1 FROM especialidades WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (duplicate.rowCount > 0) {
      return res.status(409).json({ message: 'Specialty already exists' });
    }

    const result = await db.query(
      'INSERT INTO especialidades (name) VALUES ($1) RETURNING id, name',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// PUT actualizar
async function updateSpecialty(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required to update Specialty' });
  }

  try {
    const existing = await db.query(
      'SELECT id, name FROM especialidades WHERE id = $1',
      [Number.parseInt(id, 10)]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    const duplicate = await db.query(
      'SELECT 1 FROM especialidades WHERE LOWER(name) = LOWER($1) AND id <> $2',
      [name, Number.parseInt(id, 10)]
    );

    if (duplicate.rowCount > 0) {
      return res.status(409).json({ message: 'Specialty already exists' });
    }

    const result = await db.query(
      'UPDATE especialidades SET name = $1 WHERE id = $2 RETURNING id, name',
      [name, Number.parseInt(id, 10)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// DELETE eliminar
async function deleteSpecialty(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM especialidades WHERE id = $1 RETURNING id, name',
      [Number.parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

module.exports = { getAllSpecialties, addnewSpecialty, updateSpecialty, deleteSpecialty };