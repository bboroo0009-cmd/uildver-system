import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Usage: node set-admin-password.js <username> <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const r = await pool.query(
  'UPDATE users SET password_hash=$1 WHERE username=$2 RETURNING username, role',
  [hash, username]
);
if (r.rowCount === 0) {
  console.error(`Хэрэглэгч "${username}" олдсонгүй.`);
  process.exit(1);
}
console.log(`Updated ${r.rows[0].username} (${r.rows[0].role})`);
await pool.end();
