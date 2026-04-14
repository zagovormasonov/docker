const { query } = require('./backend/src/config/database');

async function checkAdmin() {
  const res = await query("SELECT email, user_type FROM users WHERE email = 'samyrize77777@gmail.com'");
  console.log(JSON.stringify(res.rows, null, 2));
}

checkAdmin();
