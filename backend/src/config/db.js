import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.DATABASE_URL?.includes('localhost') || ENV.DATABASE_URL?.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
  max:              20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export async function runMigrations() {
  const { readFileSync } = await import('fs');
  const { resolve }      = await import('path');
  const root             = process.cwd();

  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    const schema   = readFileSync(resolve(root, 'database/schema.sql'), 'utf8');
    const stmts    = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.startsWith('--'));

    for (const stmt of stmts) {
      try { await client.query(stmt); } catch { /* already exists */ }
    }

    const triggers = readFileSync(resolve(root, 'database/triggers.sql'), 'utf8');
    const trigStmts = triggers
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 3 && !s.startsWith('--'));

    for (const stmt of trigStmts) {
      try { await client.query(stmt); } catch { /* already exists */ }
    }

    console.log('[DB] Migrations complete');
  } finally {
    client.release();
  }
}

export default pool;
