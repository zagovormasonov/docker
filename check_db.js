
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('twc1.net') || process.env.DATABASE_URL.includes('elephantsql') ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users table:', res.rows.map(r => r.column_name));

        // Check if payments table exists
        const res2 = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') as exists");
        console.log('Payments table exists:', res2.rows[0].exists);

        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        await pool.end();
    }
}

checkSchema();
