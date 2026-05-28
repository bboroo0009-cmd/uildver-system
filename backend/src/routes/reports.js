import { Router } from 'express';
import { query } from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/summary', authRequired, async (_req, res) => {
  const products = await query(`
    SELECT p.id, p.name,
           COALESCE(w.quantity, 0) AS warehouse,
           COALESCE(SUM(s.quantity), 0)::int AS distributed,
           COALESCE((
             SELECT SUM(quantity)::int FROM transactions
             WHERE product_id = p.id AND type = 'sell'
           ), 0) AS sold
    FROM products p
    LEFT JOIN warehouse_stock w ON w.product_id = p.id
    LEFT JOIN distributor_stock s ON s.product_id = p.id
    WHERE p.is_archived = FALSE
    GROUP BY p.id, w.quantity
    ORDER BY p.id
  `);

  const lowStock = await query(`
    SELECT p.id, p.name, p.low_stock_threshold,
           COALESCE(w.quantity, 0) AS warehouse_quantity
    FROM products p
    LEFT JOIN warehouse_stock w ON w.product_id = p.id
    WHERE p.is_archived = FALSE
      AND COALESCE(w.quantity, 0) <= p.low_stock_threshold
    ORDER BY COALESCE(w.quantity, 0) ASC, p.name ASC
  `);

  const distributors = await query('SELECT COUNT(*)::int AS count FROM distributors');

  const totalRevenue = await query(`
    SELECT COALESCE(SUM(quantity * unit_price), 0)::float8 AS total_revenue
    FROM transactions WHERE type = 'sell'
  `);

  const recent = await query(`
    SELECT t.id, t.product_id, t.distributor_id, t.type, t.quantity,
           t.unit_price::float8 AS unit_price,
           t.note, t.user_id, t.created_at,
           p.name AS product_name, d.name AS distributor_name, u.username
    FROM transactions t
    LEFT JOIN products p ON p.id = t.product_id
    LEFT JOIN distributors d ON d.id = t.distributor_id
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT 20
  `);

  res.json({
    products: products.rows,
    low_stock: lowStock.rows,
    distributor_count: distributors.rows[0].count,
    total_revenue: totalRevenue.rows[0].total_revenue,
    recent_transactions: recent.rows,
  });
});

router.get('/sales', authRequired, async (_req, res) => {
  const byProduct = await query(`
    SELECT p.id, p.name,
           COALESCE(SUM(t.quantity), 0)::int AS quantity_sold,
           COALESCE(SUM(t.quantity * t.unit_price), 0)::float8 AS revenue
    FROM products p
    LEFT JOIN transactions t ON t.product_id = p.id AND t.type = 'sell'
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(t.quantity), 0) > 0
    ORDER BY revenue DESC, quantity_sold DESC
  `);

  const byDistributor = await query(`
    SELECT d.id, d.name,
           COALESCE(SUM(t.quantity), 0)::int AS quantity_sold,
           COALESCE(SUM(t.quantity * t.unit_price), 0)::float8 AS revenue
    FROM distributors d
    LEFT JOIN transactions t ON t.distributor_id = d.id AND t.type = 'sell'
    GROUP BY d.id, d.name
    HAVING COALESCE(SUM(t.quantity), 0) > 0
    ORDER BY revenue DESC, quantity_sold DESC
  `);

  const byDistributorProduct = await query(`
    SELECT d.id AS distributor_id, d.name AS distributor_name,
           p.id AS product_id, p.name AS product_name,
           SUM(t.quantity)::int AS quantity_sold,
           COALESCE(SUM(t.quantity * t.unit_price), 0)::float8 AS revenue
    FROM transactions t
    JOIN distributors d ON d.id = t.distributor_id
    JOIN products p ON p.id = t.product_id
    WHERE t.type = 'sell'
    GROUP BY d.id, d.name, p.id, p.name
    ORDER BY d.name, revenue DESC
  `);

  const recent = await query(`
    SELECT t.id, t.product_id, t.distributor_id, t.type, t.quantity,
           t.unit_price::float8 AS unit_price,
           (t.quantity * t.unit_price)::float8 AS total_price,
           t.note, t.user_id, t.created_at,
           p.name AS product_name, d.name AS distributor_name, u.username
    FROM transactions t
    LEFT JOIN products p ON p.id = t.product_id
    LEFT JOIN distributors d ON d.id = t.distributor_id
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.type = 'sell'
    ORDER BY t.created_at DESC LIMIT 200
  `);

  const totals = await query(`
    SELECT COALESCE(SUM(quantity), 0)::int AS total_sold,
           COALESCE(SUM(quantity * unit_price), 0)::float8 AS total_revenue,
           COUNT(*)::int AS sale_count
    FROM transactions WHERE type = 'sell'
  `);

  res.json({
    by_product: byProduct.rows,
    by_distributor: byDistributor.rows,
    by_distributor_product: byDistributorProduct.rows,
    transactions: recent.rows,
    total_sold: totals.rows[0].total_sold,
    total_revenue: totals.rows[0].total_revenue,
    sale_count: totals.rows[0].sale_count,
  });
});

router.get('/transactions', authRequired, async (_req, res) => {
  const { rows } = await query(`
    SELECT t.*, p.name AS product_name, d.name AS distributor_name, u.username
    FROM transactions t
    LEFT JOIN products p ON p.id = t.product_id
    LEFT JOIN distributors d ON d.id = t.distributor_id
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT 200
  `);
  res.json(rows);
});

export default router;
