/**
 * Runs all SQL migrations against the configured DATABASE_URL.
 * Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS guards).
 * Usage: node backend/db/migrate.js
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pg from 'pg';

const { Client } = pg;
const __dirname  = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('[migrate] Connected to PostgreSQL');

  const migrationFile = path.join(__dirname, '../../database/migrations.sql');
  const sql           = readFileSync(migrationFile, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('[migrate] OK:', stmt.slice(0, 60).replace(/\n/g, ' ') + '…');
    } catch (err) {
      console.error('[migrate] FAILED:', stmt.slice(0, 80), '\n', err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('[migrate] All migrations complete.');
}

run().catch(err => {
  console.error('[migrate] Fatal:', err.message);
  process.exit(1);
});
