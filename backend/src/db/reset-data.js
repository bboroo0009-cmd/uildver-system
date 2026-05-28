import { pool } from './pool.js';

const result = await pool.query(`
  TRUNCATE TABLE
    transactions,
    distributor_stock,
    warehouse_stock,
    distributors,
    products
  RESTART IDENTITY CASCADE
`);

const counts = await pool.query(`
  SELECT 'products' AS t, COUNT(*)::int AS n FROM products
  UNION ALL SELECT 'distributors', COUNT(*) FROM distributors
  UNION ALL SELECT 'warehouse_stock', COUNT(*) FROM warehouse_stock
  UNION ALL SELECT 'distributor_stock', COUNT(*) FROM distributor_stock
  UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
  UNION ALL SELECT 'users', COUNT(*) FROM users
`);

console.log('Цэвэрлэгдсэн. Үлдсэн мөрийн тоо:');
counts.rows.forEach((r) => console.log(`  ${r.t}: ${r.n}`));
await pool.end();
