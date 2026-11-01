import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db';

const router = Router();
const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const sign = (userId: number) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse(req.body);
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );
    res.status(201).json({ token: sign(rows[0].id) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse(req.body);
    const { rows } = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json({ token: sign(user.id) });
  } catch (err) {
    next(err);
  }
});

export default router;