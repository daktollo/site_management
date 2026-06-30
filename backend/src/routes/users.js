import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/users — list users (everyone needs this to assign shares/tasks)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.full_name, u.email, u.role, u.unit_id, un.label AS unit_label
       FROM users u LEFT JOIN units un ON un.id = u.unit_id
       ORDER BY u.full_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/users — admin creates a user (email is optional)
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { full_name, email = null, password, role = 'resident', unit_id = null } = req.body || {};
    if (!full_name || !password) {
      return res.status(400).json({ error: 'full_name and password are required' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role, unit_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, unit_id`,
      [full_name, email || null, hash, role, unit_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That name or email is already in use' });
    next(err);
  }
});

// DELETE /api/users/:id — admin removes a user (cannot remove self)
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'This user has transactions and cannot be deleted. Reassign or remove them first.',
      });
    }
    next(err);
  }
});

export default router;
