const bcrypt = require('bcryptjs');
const db = require('../db');
const HttpError = require('../utils/http-error');
const { signToken } = require('../middleware/auth');

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

async function register(req, res) {
  const { name, lastName, email, password, phone, gender, birthDate } = req.body;
  const existing = await db.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
  if (existing.rowCount > 0) throw new HttpError(409, 'Email is already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.transaction(async (client) => {
    const user = await client.query(
      `INSERT INTO usuarios (email, password_hash, role)
       VALUES ($1, $2, 'client') RETURNING id, email, role`,
      [email, passwordHash]
    );
    const patient = await client.query(
      `INSERT INTO pacientes (user_id, name, last_name, email, phone, gender, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, last_name AS "lastName", email, phone, gender,
                 birth_date AS "birthDate", illness`,
      [user.rows[0].id, name, lastName, email, phone, gender, birthDate || null]
    );
    return { user: user.rows[0], profile: patient.rows[0] };
  });

  res.status(201).json({
    token: signToken(result.user),
    user: publicUser(result.user),
    profile: result.profile
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await db.query(
    'SELECT id, email, password_hash, role, active FROM usuarios WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  const valid = user && user.active && await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new HttpError(401, 'Invalid email or password');

  res.json({ token: signToken(user), user: publicUser(user) });
}

async function me(req, res) {
  const result = await db.query(
    'SELECT id, email, role, active FROM usuarios WHERE id = $1',
    [Number(req.user.sub)]
  );
  if (result.rowCount === 0 || !result.rows[0].active) {
    throw new HttpError(401, 'Account is not active');
  }
  res.json(publicUser(result.rows[0]));
}

module.exports = { login, me, register };
