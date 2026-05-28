import { Router } from 'express';
import { pool, query } from '../db/pool.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, async (_req, res) => {
  const { rows } = await query(`
    SELECT d.*,
      COALESCE(json_agg(
        json_build_object('product_id', s.product_id, 'product_name', p.name, 'quantity', s.quantity)
      ) FILTER (WHERE s.product_id IS NOT NULL), '[]') AS stock
    FROM distributors d
    LEFT JOIN distributor_stock s ON s.distributor_id = d.id
    LEFT JOIN products p ON p.id = s.product_id
    GROUP BY d.id
    ORDER BY d.id
  `);
  res.json(rows);
});

router.post('/', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { name, phone, location } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Нэр шаардлагатай' });
  const { rows } = await query(
    'INSERT INTO distributors (name, phone, location) VALUES ($1, $2, $3) RETURNING *',
    [name, phone || null, location || null]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { name, phone, location } = req.body || {};
  const { rows } = await query(
    `UPDATE distributors SET name = COALESCE($1, name),
                              phone = COALESCE($2, phone),
                              location = COALESCE($3, location)
     WHERE id = $4 RETURNING *`,
    [name, phone, location, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Олдсонгүй' });
  res.json(rows[0]);
});

router.delete('/:id', authRequired, requireRole('admin'), async (req, res) => {
  await query('DELETE FROM distributors WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Агуулахаас борлуулагч руу шилжүүлэх
router.post('/:id/transfer', authRequired, requireRole('admin', 'uildver'), async (req, res) => {
  const { product_id, quantity, note } = req.body || {};
  const qty = parseInt(quantity, 10);
  if (!product_id || !qty || qty <= 0) {
    return res.status(400).json({ error: 'product_id, quantity шаардлагатай' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const w = await client.query(
      'SELECT quantity FROM warehouse_stock WHERE product_id = $1 FOR UPDATE',
      [product_id]
    );
    if (!w.rows[0] || w.rows[0].quantity < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Агуулахад хангалттай нөөц алга' });
    }

    await client.query(
      'UPDATE warehouse_stock SET quantity = quantity - $1, updated_at = NOW() WHERE product_id = $2',
      [qty, product_id]
    );
    await client.query(
      `INSERT INTO distributor_stock (distributor_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (distributor_id, product_id)
       DO UPDATE SET quantity = distributor_stock.quantity + $3, updated_at = NOW()`,
      [req.params.id, product_id, qty]
    );
    await client.query(
      `INSERT INTO transactions (product_id, distributor_id, type, quantity, note, user_id)
       VALUES ($1, $2, 'transfer', $3, $4, $5)`,
      [product_id, req.params.id, qty, note || null, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Борлуулагч бүтээгдэхүүн зарсныг бүртгэх
router.post('/:id/sell', authRequired, async (req, res) => {
  const { product_id, quantity, note, unit_price } = req.body || {};
  const qty = parseInt(quantity, 10);
  if (!product_id || !qty || qty <= 0) {
    return res.status(400).json({ error: 'product_id, quantity шаардлагатай' });
  }
  let price = null;
  if (unit_price !== undefined && unit_price !== null && unit_price !== '') {
    price = Number(unit_price);
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Үнэ буруу' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const s = await client.query(
      `SELECT quantity FROM distributor_stock
       WHERE distributor_id = $1 AND product_id = $2 FOR UPDATE`,
      [req.params.id, product_id]
    );
    if (!s.rows[0] || s.rows[0].quantity < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Борлуулагчид хангалттай нөөц алга' });
    }
    if (price === null) {
      const p = await client.query('SELECT sale_price FROM products WHERE id = $1', [product_id]);
      price = p.rows[0] ? Number(p.rows[0].sale_price) : 0;
    }
    await client.query(
      `UPDATE distributor_stock SET quantity = quantity - $1, updated_at = NOW()
       WHERE distributor_id = $2 AND product_id = $3`,
      [qty, req.params.id, product_id]
    );
    await client.query(
      `INSERT INTO transactions (product_id, distributor_id, type, quantity, unit_price, note, user_id)
       VALUES ($1, $2, 'sell', $3, $4, $5, $6)`,
      [product_id, req.params.id, qty, price, note || null, req.user.id]
    );
    await client.query('COMMIT');
    res.json({ ok: true, unit_price: price, total: price * qty });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export default router;
