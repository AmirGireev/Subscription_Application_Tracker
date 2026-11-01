import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calcStats } from '../lib/burn';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  name: z.string().min(1),
  cost_cents: z.number().int().min(0),
  billing_cycle: z.enum(['monthly', 'yearly']),
  category: z.string().min(1).default('other'),
  status: z.enum(['active', 'cancelled']).default('active'),
  next_billing_date: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ::text stops pg from turning the date into a JS Date (timezone shifts)
const COLS = `id, name, cost_cents, billing_cycle, category, status,
  next_billing_date::text AS next_billing_date, notes`;

router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [req.userId]
    );
    res.json(calcStats(rows));
  } catch (err) { next(err); }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const params: unknown[] = [req.userId];
    let sql = `SELECT ${COLS} FROM subscriptions WHERE user_id = $1`;
    if (typeof req.query.status === 'string') {
      params.push(req.query.status);
      sql += ` AND status = $${params.length}`;
    }
    if (typeof req.query.category === 'string') {
      params.push(req.query.category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const d = schema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO subscriptions
         (user_id, name, cost_cents, billing_cycle, category, status, next_billing_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLS}`,
      [req.userId, d.name, d.cost_cents, d.billing_cycle, d.category, d.status,
       d.next_billing_date ?? null, d.notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const d = schema.parse(req.body);
    const { rows, rowCount } = await pool.query(
      `UPDATE subscriptions SET name=$1, cost_cents=$2, billing_cycle=$3, category=$4,
         status=$5, next_billing_date=$6, notes=$7
       WHERE id=$8 AND user_id=$9 RETURNING ${COLS}`,
      [d.name, d.cost_cents, d.billing_cycle, d.category, d.status,
       d.next_billing_date ?? null, d.notes ?? null, req.params.id, req.userId]
    );
    if (!rowCount) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM subscriptions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!rowCount) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;