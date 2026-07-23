require('dotenv').config();
const db = require('../src/database');

db.initialize()
  .then(async () => {
    console.log('Database schema is up to date');
    await db.pool.end();
  })
  .catch((error) => {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  });
