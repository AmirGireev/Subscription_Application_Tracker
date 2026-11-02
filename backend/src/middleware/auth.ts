// imports
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// request type
export interface AuthRequest extends Request {
  userId?: number;
}

// auth middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // read header
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  // verify token
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}