import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/cleaning/tasks — task definitions
router.get('/tasks', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, description, frequency, created_at FROM cleaning_tasks ORDER BY name'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/cleaning/tasks — admin creates a task
router.post('/tasks', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description = null, frequency } = req.body || {};
    if (!name || !frequency) return res.status(400).json({ error: 'name and frequency are required' });
    if (!['daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be daily or weekly' });
    }
    const { rows } = await query(
      'INSERT INTO cleaning_tasks (name, description, frequency) VALUES ($1, $2, $3) RETURNING *',
      [name, description, frequency]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/cleaning/assignments — assignments, optionally ?mine=1
router.get('/assignments', async (req, res, next) => {
  try {
    const mine = req.query.mine === '1' || req.query.mine === 'true';
    const params = [];
    let where = '';
    if (mine) { where = 'WHERE a.assignee_id = $1'; params.push(req.user.id); }
    const { rows } = await query(
      `SELECT a.id, to_char(a.scheduled_date, 'YYYY-MM-DD') AS scheduled_date,
              a.status, a.completed_at,
              t.id AS task_id, t.name AS task_name, t.frequency,
              u.id AS assignee_id, u.full_name AS assignee_name
       FROM cleaning_assignments a
       JOIN cleaning_tasks t ON t.id = a.task_id
       JOIN users u ON u.id = a.assignee_id
       ${where}
       ORDER BY a.scheduled_date, t.name`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/cleaning/assignments — assign a task for a day (any authenticated user)
router.post('/assignments', async (req, res, next) => {
  try {
    const { task_id, assignee_id, scheduled_date } = req.body || {};
    if (!task_id || !assignee_id || !scheduled_date) {
      return res.status(400).json({ error: 'task_id, assignee_id and scheduled_date are required' });
    }
    const { rows } = await query(
      `INSERT INTO cleaning_assignments (task_id, assignee_id, scheduled_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [task_id, assignee_id, scheduled_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ error: 'task or assignee not found' });
    next(err);
  }
});

// POST /api/cleaning/assignments/:id/done — mark an assignment done
router.post('/assignments/:id/done', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, assignee_id, status FROM cleaning_assignments WHERE id = $1',
      [req.params.id]
    );
    const a = rows[0];
    if (!a) return res.status(404).json({ error: 'Assignment not found' });
    if (a.assignee_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only complete your own assignment' });
    }
    if (a.status === 'done') return res.status(409).json({ error: 'Already completed' });
    const { rows: updated } = await query(
      `UPDATE cleaning_assignments SET status = 'done', completed_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) { next(err); }
});

// DELETE /api/cleaning/assignments/:id — cancel an assignment (assignee or admin)
router.delete('/assignments/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, assignee_id FROM cleaning_assignments WHERE id = $1',
      [req.params.id]
    );
    const a = rows[0];
    if (!a) return res.status(404).json({ error: 'Assignment not found' });
    if (a.assignee_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only cancel your own assignment' });
    }
    await query('DELETE FROM cleaning_assignments WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
