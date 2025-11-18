const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'synergy',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'synergy_db',
  password: process.env.DB_PASSWORD || 'synergy123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function run() {
  try {
    console.log('Adding is_active column to expert_availability...');
    await pool.query('ALTER TABLE expert_availability ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();

