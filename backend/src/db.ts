// imports
import { Pool } from 'pg';
// database pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });