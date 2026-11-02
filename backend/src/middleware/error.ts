// imports
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// error handler
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues });
  } else if (err.code === '23505') {
    res.status(409).json({ error: 'Email already registered' });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}