// imports
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// error handler
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    // validation error
    res.status(400).json({ error: err.issues });
  } else if (err.code === '23505') {
    // duplicate email
    res.status(409).json({ error: 'Email already registered' });
  } else {
    // server error
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}