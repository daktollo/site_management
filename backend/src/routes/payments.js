import { Router } from 'express';
import { pool, query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/payments/transactions — all transactions with their shares
router.get('/transactions', async (req, res, next) => {
  try {
    const { rows: txns } = await query(
      `SELECT t.id, t.name, t.description, t.type, t.amount,
              to_char(t.due_date, 'YYYY-MM-DD') AS due_date, t.created_at,
              t.created_by, u.full_name AS created_by_name
       FROM transactions t
       JOIN users u ON u.id = t.created_by
       ORDER BY t.created_at DESC`
    );
    const { rows: shares } = await query(
      `SELECT s.id, s.transaction_id, s.user_id, s.amount_due, s.status, s.paid_at,
              u.full_name AS user_name
       FROM transaction_shares s
       JOIN users u ON u.id = s.user_id
       ORDER BY u.full_name`
    );
    const byTxn = new Map(txns.map((t) => [t.id, { ...t, shares: [] }]));
    for (const s of shares) byTxn.get(s.transaction_id)?.shares.push(s);
    res.json([...byTxn.values()]);
  } catch (err) { next(err); }
});

// GET /api/payments/my — current user's pending shares (the Payments tab)
router.get('/my', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.id AS share_id, s.amount_due, s.status, s.paid_at,
              t.id AS transaction_id, t.name, t.description,
              to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
              creator.full_name AS created_by_name
       FROM transaction_shares s
       JOIN transactions t ON t.id = s.transaction_id
       JOIN users creator ON creator.id = t.created_by
       WHERE s.user_id = $1
       ORDER BY (s.status = 'paid'), t.due_date NULLS LAST, t.created_at`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/payments/debts — everyone's outstanding debt
router.get('/debts', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.full_name,
              COALESCE(SUM(s.amount_due) FILTER (WHERE s.status = 'pending'), 0) AS outstanding,
              COALESCE(SUM(s.amount_due) FILTER (WHERE s.status = 'paid'), 0)    AS paid
       FROM users u
       LEFT JOIN transaction_shares s ON s.user_id = u.id
       GROUP BY u.id, u.full_name
       ORDER BY outstanding DESC, u.full_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/payments/transactions — create a named transaction.
// For a 'payment' type, provide participants: [{ user_id, amount_due }].
router.post('/transactions', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      name, description = null, type, amount, due_date = null, participants = [],
    } = req.body || {};

    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    if (!['payment', 'expense', 'income'].includes(type)) {
      return res.status(400).json({ error: 'type must be payment, expense or income' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return res.status(400).json({ error: 'amount must be a non-negative number' });
    }
    if (type === 'payment' && participants.length === 0) {
      return res.status(400).json({ error: 'payment transactions need at least one participant' });
    }

    await client.query('BEGIN');
    const { rows: txnRows } = await client.query(
      `INSERT INTO transactions (name, description, type, amount, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, type, amount, due_date, created_at, created_by`,
      [name, description, type, amt, req.user.id, due_date]
    );
    const txn = txnRows[0];

    if (type === 'payment') {
      for (const p of participants) {
        const share = Number(p.amount_due);
        if (!p.user_id || !Number.isFinite(share) || share < 0) {
          throw Object.assign(new Error('Each participant needs a user_id and non-negative amount_due'), { status: 400 });
        }
        await client.query(
          `INSERT INTO transaction_shares (transaction_id, user_id, amount_due)
           VALUES ($1, $2, $3)`,
          [txn.id, p.user_id, share]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(txn);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/payments/shares/:id/pay — mark a share as paid.
// Allowed for the share owner or an admin.
router.post('/shares/:id/pay', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, user_id, status FROM transaction_shares WHERE id = $1',
      [req.params.id]
    );
    const share = rows[0];
    if (!share) return res.status(404).json({ error: 'Share not found' });
    if (share.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only pay your own share' });
    }
    if (share.status === 'paid') return res.status(409).json({ error: 'Share already paid' });

    const { rows: updated } = await query(
      `UPDATE transaction_shares SET status = 'paid', paid_at = now()
       WHERE id = $1 RETURNING id, transaction_id, user_id, amount_due, status, paid_at`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) { next(err); }
});

export default router;
