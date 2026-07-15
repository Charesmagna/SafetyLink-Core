import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

if (!process.env.SQL_HOST || !process.env.SQL_DB_NAME || !process.env.SQL_ADMIN_USER || !process.env.SQL_ADMIN_PASSWORD) {
  console.warn("SQL environment variables missing, DB connection will fail.");
}

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
  ssl: false,
});

pool.on('error', (err) => { console.error('Unexpected error on idle client', err); });
export const db = drizzle(pool, { schema });
