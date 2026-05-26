import { Router } from 'express';
import { query } from '../db/pool.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, async (_req, res) => {
  const { rows } = await query(`
    SELECT p.id, p.name, p.description, p.low_stock_threshold,
           COALESCE(w.quantity, 0) AS warehouse_quantity,
           COALESCE(d.total_distributed, 0) AS total_distributed
    FROM products p
    LEFT JOIN warehouse_stock w ON w.product_id = p.id
    LEFT JOIN (
      SELECT product_id, SUM(quantity)::int AS total_distributed
      FROM distributor_stock GROUP BY product_id
    ) d ON d.product_id = p.id
    WHERE p.is_archived = FALSE
    ORDER BY p.id
  `);
  res.json(rows);
});

router.post('/', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Нэр шаардлагатай' });
  try {
    const { rows } = await query(
      'INSERT INTO products (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    await query(
      'INSERT INTO warehouse_stock (product_id, quantity) VALUES ($1, 0) ON CONFLICT DO NOTHING',
      [rows[0].id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ийм нэртэй бүтээгдэхүүн байна' });
    throw err;
  }
});

router.put('/:id', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { name, description, low_stock_threshold } = req.body || {};
  let threshold = null;
  if (low_stock_threshold !== undefined && low_stock_threshold !== null && low_stock_threshold !== '') {
    threshold = parseInt(low_stock_threshold, 10);
    if (Number.isNaN(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'low_stock_threshold буруу' });
    }
  }
  const { rows } = await query(
    `UPDATE products SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       low_stock_threshold = COALESCE($3, low_stock_threshold)
     WHERE id = $4 RETURNING *`,
    [name, description, threshold, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Олдсонгүй' });
  res.json(rows[0]);
});

router.delete('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  const tx = await query('SELECT 1 FROM transactions WHERE product_id = $1 LIMIT 1', [id]);
  if (tx.rows.length > 0) {
    const { rows } = await query(
      'UPDATE products SET is_archived = TRUE WHERE id = $1 RETURNING id, name',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Олдсонгүй' });
    return res.json({ ok: true, archived: true, message: 'Гүйлгээ бүртгэгдсэн тул архивлав.' });
  }
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Олдсонгүй' });
  res.json({ ok: true, archived: false });
});

// Үйлдвэрлэл бүртгэх (агуулахын нөөц нэмэх)
router.post('/:id/produce', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { quantity, note } = req.body || {};
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Тоо ширхэг буруу' });

  const client = await (await import('../db/pool.js')).pool.connect();
  try {
    await client.query('BEGIN');
    const upd = await client.query(
      `INSERT INTO warehouse_stock (product_id, quantity) VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET quantity = warehouse_stock.quantity + $2, updated_at = NOW()
       RETURNING quantity`,
      [req.params.id, qty]
    );
    await client.query(
      `INSERT INTO transactions (product_id, type, quantity, note, user_id)
       VALUES ($1, 'produce', $2, $3, $4)`,
      [req.params.id, qty, note || null, req.user.id]
    );
    await client.query('COMMIT');
    res.json({ warehouse_quantity: upd.rows[0].quantity });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
