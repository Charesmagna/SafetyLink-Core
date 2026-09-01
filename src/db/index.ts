import { createClient } from '@libsql/client';
import { env } from '../config/env';

const dbPath = env.NODE_ENV === "production" ? "file:/tmp/safetylink.db" : "file:safetylink.db";
export const db = createClient({ url: dbPath });

export const query = async (text: string, params?: any[]) => {
  // Replace PostgreSQL positional arguments ($1, $2, etc) with SQLite positional (?)
  const sql = text.replace(/\$\d+/g, '?');
  const res = await db.execute({ sql, args: params || [] });
  return {
    rows: res.rows,
    rowCount: res.rows.length,
    rowsAffected: res.rowsAffected
  };
};
