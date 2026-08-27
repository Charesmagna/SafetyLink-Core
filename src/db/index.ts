import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};
