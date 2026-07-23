const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

function createPool() {
  if (process.env.NODE_ENV === 'test') {
    const { newDb } = require('pg-mem');
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
    const adapter = memoryDb.adapters.createPg();
    return new adapter.Pool();
  }

  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };

  if (process.env.DB_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replaceAll('\\n', '\n') } : {})
    };
  }
  return new Pool(config);
}

const pool = createPool();
let initialization;

async function initialize() {
  if (!initialization) {
    initialization = (async () => {
      await pool.query(schema);
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hospital.local').toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO usuarios (email, password_hash, role)
         VALUES ($1, $2, 'admin')
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, passwordHash]
      );
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

async function query(text, params) {
  await initialize();
  return pool.query(text, params);
}

async function transaction(callback) {
  await initialize();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initialize, query, transaction, pool };
