import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/properties — properties with their units and residents
router.get('/', async (req, res, next) => {
  try {
    const { rows: properties } = await query(
      'SELECT id, name, address, created_at FROM properties ORDER BY name'
    );
    const { rows: units } = await query(
      `SELECT un.id, un.property_id, un.label,
              u.id AS resident_id, u.full_name AS resident_name
       FROM units un
       LEFT JOIN users u ON u.unit_id = un.id
       ORDER BY un.label`
    );
    const byProperty = new Map(properties.map((p) => [p.id, { ...p, units: [] }]));
    for (const un of units) {
      const p = byProperty.get(un.property_id);
      if (p) p.units.push(un);
    }
    res.json([...byProperty.values()]);
  } catch (err) { next(err); }
});

// POST /api/properties — admin adds a property
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, address = null } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await query(
      'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING id, name, address, created_at',
      [name, address]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/properties/:id/units — admin adds a unit
router.post('/:id/units', requireRole('admin'), async (req, res, next) => {
  try {
    const { label } = req.body || {};
    if (!label) return res.status(400).json({ error: 'label is required' });
    const { rows } = await query(
      'INSERT INTO units (property_id, label) VALUES ($1, $2) RETURNING id, property_id, label',
      [req.params.id, label]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ error: 'Property not found' });
    next(err);
  }
});

export default router;
