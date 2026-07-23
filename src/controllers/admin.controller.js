const db = require('../db');

async function summary(req, res) {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM usuarios WHERE active=TRUE) AS users,
      (SELECT COUNT(*)::int FROM doctores WHERE active=TRUE) AS doctors,
      (SELECT COUNT(*)::int FROM pacientes) AS patients,
      (SELECT COUNT(*)::int FROM citas) AS appointments,
      (SELECT COUNT(*)::int FROM citas WHERE status='pending') AS pending,
      (SELECT COUNT(*)::int FROM recetas) AS prescriptions
  `);
  const counts = Object.fromEntries(
    Object.entries(result.rows[0]).map(([key, value]) => [key, Number(value)])
  );
  res.json(counts);
}

module.exports = { summary };
