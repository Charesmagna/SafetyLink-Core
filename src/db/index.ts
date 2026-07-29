import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import fs from 'fs';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
const dbPath = isProd ? '/tmp/sqlite.db' : 'sqlite.db';

if (isProd && !fs.existsSync(dbPath)) {
  const sourceDb = path.join(process.cwd(), 'sqlite.db');
  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, dbPath);
    console.log("Copied bundled sqlite.db to /tmp/sqlite.db");
  } else {
    console.warn("Source sqlite.db not found at", sourceDb);
  }
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });