// CRUD OF DOCTORS
// {
//    id
//    name
//    lastName
//    specialtyId
//    specialty
//    phone
//    email
//    licenseNumber
// }

const db = require('../db');

async function resolveSpecialtyId({ specialtyId, specialty }) {
  if (specialtyId) return Number.parseInt(specialtyId, 10);

  if (!specialty) return null;

  const existing = await db.query(
    'SELECT id FROM especialidades WHERE LOWER(name) = LOWER($1)',
    [specialty]
  );

  if (existing.rowCount > 0) return existing.rows[0].id;

  try {
    const created = await db.query(
      'INSERT INTO especialidades (name) VALUES ($1) RETURNING id',
      [specialty]
    );

    return created.rows[0].id;
  } catch (error) {
    if (error.code === '23505') {
      const retry = await db.query(
        'SELECT id FROM especialidades WHERE LOWER(name) = LOWER($1)',
        [specialty]
      );
      if (retry.rowCount > 0) return retry.rows[0].id;
    }
    throw error;
  }
}

// GET - List all doctors
async function getAllDoctors(req, res) {
  try {
    const result = await db.query(
      'SELECT d.id, d.name, d.last_name AS "lastName", d.specialty_id AS "specialtyId", s.name AS specialty, d.phone, d.email, d.license_number AS "licenseNumber" FROM doctores d JOIN especialidades s ON s.id = d.specialty_id ORDER BY d.id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// POST - Add new doctor
async function addNewDoctor(req, res) {
  const { name, lastName, specialtyId, specialty, phone, email, licenseNumber } = req.body;

  // Validate required fields
  if (!name || !lastName || (!specialtyId && !specialty) || !phone || !email || !licenseNumber) {
    return res.status(400).json({ 
      message: 'Name, Last Name, Specialty, Phone, Email and License Number are required' 
    });
  }

  try {
    const resolvedSpecialtyId = await resolveSpecialtyId({ specialtyId, specialty });
    if (!resolvedSpecialtyId) {
      return res.status(400).json({ message: 'Specialty is required' });
    }

    const duplicate = await db.query(
      'SELECT 1 FROM doctores WHERE license_number = $1',
      [licenseNumber]
    );

    if (duplicate.rowCount > 0) {
      return res.status(409).json({
        message: 'A doctor with this license number already exists'
      });
    }

    const result = await db.query(
      'INSERT INTO doctores (name, last_name, specialty_id, phone, email, license_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, last_name AS "lastName", specialty_id AS "specialtyId", phone, email, license_number AS "licenseNumber"',
      [name, lastName, resolvedSpecialtyId, phone, email, licenseNumber]
    );

    const withSpecialty = await db.query(
      'SELECT d.id, d.name, d.last_name AS "lastName", d.specialty_id AS "specialtyId", s.name AS specialty, d.phone, d.email, d.license_number AS "licenseNumber" FROM doctores d JOIN especialidades s ON s.id = d.specialty_id WHERE d.id = $1',
      [result.rows[0].id]
    );

    res.status(201).json(withSpecialty.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// PUT - Update doctor
async function updateDoctor(req, res) {
  const { id } = req.params;
  const { name, lastName, specialtyId, specialty, phone, email, licenseNumber } = req.body;

  try {
    const existing = await db.query(
      'SELECT id, name, last_name, specialty_id, phone, email, license_number FROM doctores WHERE id = $1',
      [Number.parseInt(id, 10)]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const current = existing.rows[0];
    const nextLicense = licenseNumber || current.license_number;
    const hasSpecialtyChange = Boolean(specialtyId || specialty);
    const resolvedSpecialtyId = hasSpecialtyChange
      ? await resolveSpecialtyId({ specialtyId, specialty })
      : current.specialty_id;

    if (hasSpecialtyChange && !resolvedSpecialtyId) {
      return res.status(400).json({ message: 'Specialty is required' });
    }

    if (licenseNumber && licenseNumber !== current.license_number) {
      const duplicate = await db.query(
        'SELECT 1 FROM doctores WHERE license_number = $1 AND id <> $2',
        [licenseNumber, current.id]
      );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          message: 'A doctor with this license number already exists'
        });
      }
    }

    const result = await db.query(
      'UPDATE doctores SET name = $1, last_name = $2, specialty_id = $3, phone = $4, email = $5, license_number = $6 WHERE id = $7 RETURNING id, name, last_name AS "lastName", specialty_id AS "specialtyId", phone, email, license_number AS "licenseNumber"',
      [
        name || current.name,
        lastName || current.last_name,
        resolvedSpecialtyId,
        phone || current.phone,
        email || current.email,
        nextLicense,
        current.id
      ]
    );

    const withSpecialty = await db.query(
      'SELECT d.id, d.name, d.last_name AS "lastName", d.specialty_id AS "specialtyId", s.name AS specialty, d.phone, d.email, d.license_number AS "licenseNumber" FROM doctores d JOIN especialidades s ON s.id = d.specialty_id WHERE d.id = $1',
      [result.rows[0].id]
    );

    res.json(withSpecialty.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// DELETE - Delete doctor
async function deleteDoctor(req, res) {
  const { id } = req.params;

  try {
    const existing = await db.query(
      'SELECT d.id, d.name, d.last_name AS "lastName", d.specialty_id AS "specialtyId", s.name AS specialty, d.phone, d.email, d.license_number AS "licenseNumber" FROM doctores d JOIN especialidades s ON s.id = d.specialty_id WHERE d.id = $1',
      [Number.parseInt(id, 10)]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const result = await db.query(
      'DELETE FROM doctores WHERE id = $1',
      [Number.parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(existing.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
}

module.exports = { getAllDoctors, addNewDoctor, updateDoctor, deleteDoctor };
