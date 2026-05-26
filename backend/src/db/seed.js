import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

async function seed() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const uildverHash = await bcrypt.hash('uildver123', 10);

  await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
     ON CONFLICT (username) DO NOTHING`,
    [
      'admin', adminHash, 'Админ', 'admin',
      'uildver', uildverHash, 'Үйлдвэрчин', 'uildver',
    ]
  );

  const products = [
    { name: 'Домбо', description: 'Уламжлалт сүүн домбо' },
    { name: 'Айрагны хувин', description: 'Айраг хадгалах хувин' },
    { name: 'Мөнгөн аяга', description: 'Мөнгөн уран хийцтэй аяга' },
  ];

  for (const p of products) {
    const r = await pool.query(
      `INSERT INTO products (name, description) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [p.name, p.description]
    );
    await pool.query(
      `INSERT INTO warehouse_stock (product_id, quantity) VALUES ($1, 0)
       ON CONFLICT (product_id) DO NOTHING`,
      [r.rows[0].id]
    );
  }

  console.log('Seed complete.');
  console.log('Нэвтрэх: admin / admin123  эсвэл  uildver / uildver123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
