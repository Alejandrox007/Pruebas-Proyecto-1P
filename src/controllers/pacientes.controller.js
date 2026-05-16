// {
//    id
//    nombre
//    apellido
//    email
//    telefono
//    sexo
//    enfermedad
// }
const db = require('../db');

// GET
async function getAllPatients(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name, last_name AS "lastName", email, gender, illness FROM pacientes ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// POST
async function addnewPatient(req, res) {
  const { name, lastName, email, gender, illness } = req.body;

  // Validación básica de entrada
  if (!name || !lastName || !email || !gender || !illness) {
    return res.status(400).json({ message: 'Name, Last Name, Email, Gender and Illness are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO pacientes (name, last_name, email, gender, illness) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, last_name AS "lastName", email, gender, illness',
      [name, lastName, email, gender, illness]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// PUT
async function updatePatient(req, res) {
  const { id } = req.params;
  const { name, lastName, email, gender, illness } = req.body;

  try {
    const existing = await db.query(
      'SELECT id, name, last_name, email, gender, illness FROM pacientes WHERE id = $1',
      [Number.parseInt(id, 10)]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const current = existing.rows[0];
    const result = await db.query(
      'UPDATE pacientes SET name = $1, last_name = $2, email = $3, gender = $4, illness = $5 WHERE id = $6 RETURNING id, name, last_name AS "lastName", email, gender, illness',
      [
        name || current.name,
        lastName || current.last_name,
        email || current.email,
        gender || current.gender,
        illness || current.illness,
        current.id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// DELETE
async function deletePatient(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM pacientes WHERE id = $1 RETURNING id, name, last_name AS "lastName", email, gender, illness',
      [Number.parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

module.exports = { getAllPatients, addnewPatient, updatePatient, deletePatient };
