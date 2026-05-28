import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Хэрэглэгчийн нэр, нууц үг шаардлагатай' });
  }
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Нэр эсвэл нууц үг буруу' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
  });
});

router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/users', authRequired, requireRole('admin'), async (req, res) => {
  const { username, password, full_name, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Дутуу талбар' });
  }
  if (!['admin', 'uildver', 'borluulagch'].includes(role)) {
    return res.status(400).json({ error: 'Role буруу' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role`,
      [username, hash, full_name || null, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Хэрэглэгчийн нэр давхцаж байна' });
    throw err;
  }
});

router.get('/users', authRequired, requireRole('admin'), async (_req, res) => {
  const { rows } = await query(
    'SELECT id, username, full_name, role, created_at FROM users ORDER BY id'
  );
  res.json(rows);
});

router.put('/users/:id/password', authRequired, requireRole('admin'), async (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Нууц үг 6-аас доошгүй тэмдэгт байх ёстой' });
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username',
    [hash, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Олдсонгүй' });
  res.json({ ok: true, username: rows[0].username });
});

router.delete('/users/:id', authRequired, requireRole('admin'), async (req, res) => {
  if (parseInt(req.params.id, 10) === req.user.id) {
    return res.status(400).json({ error: 'Өөрийгөө устгах боломжгүй' });
  }
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Олдсонгүй' });
  res.json({ ok: true });
});

export default router;
