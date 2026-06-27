/**
 * CockroachDB Connection Pooling & Transaction Handler
 * 
 * DESIGNED FOR HIGH AVAILABILITY & STRICT SERIALIZABLE ISOLATION
 * Includes transaction retry loops for serializable contention (Error 40001).
 * Hardened user privilege management & schema storage risk metrics.
 */

import pg from "pg";

const { Pool } = pg;

// Connection config adhering to CockroachDB Multi-Region Clustering
export const getCockroachPool = () => {
  const connectionString = process.env.DATABASE_URL || "postgresql://safetylink_app@localhost:26257/safetylink?sslmode=verify-full";
  
  return new Pool({
    connectionString,
    max: 20, // Strict limit on concurrent connections per node
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    keepAlive: true,
  });
};

/**
 * Executes a transactional query block with client-side retry logic.
 * CockroachDB serializable isolation level requires transactions to retry
 * in case of a retryable transaction conflict (PostgreSQL state '40001').
 */
export async function executeTx<T>(
  pool: pg.Pool,
  txBlock: (client: pg.PoolClient) => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  const client = await pool.connect();
  let attempt = 0;

  while (true) {
    try {
      await client.query("BEGIN;");
      
      // Execute user-defined queries
      const result = await txBlock(client);
      
      await client.query("COMMIT;");
      return result;
    } catch (err: any) {
      await client.query("ROLLBACK;");

      // Check if it is a CockroachDB serialization failure (Error Code 40001)
      const isRetryable = err.code === "40001";
      attempt++;

      if (isRetryable && attempt < maxRetries) {
        console.warn(`[COCKROACHDB] Transaction conflict (40001) detected. Retrying attempt ${attempt}...`);
        
        // Exponential backoff with jitter to reduce herd contention
        const backoff = Math.min(100 * Math.pow(2, attempt) + Math.random() * 50, 2000);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      // If non-retryable or max attempts exceeded, propagate error
      throw err;
    } finally {
      client.release();
    }
  }
}

/**
 * 🛡️ PRODUCTION DATABASE privilege hardening SQL queries
 * Execute these to isolate and limit server privileges.
 */
export const HARDENED_PRIVILEGE_SCRIPTS = `
  -- 1. Create limited execution role
  CREATE ROLE safetylink_app_role;
  
  -- 2. Grant operations on the schema
  GRANT USAGE, SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO safetylink_app_role;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO safetylink_app_role;
  
  -- 3. Configure least-privilege system user
  CREATE USER safetylink_app WITH PASSWORD 'SecuredPassword2026!';
  GRANT safetylink_app_role TO safetylink_app;
  
  -- 4. Audit settings configuration
  ALTER USER safetylink_app SET client_min_messages = 'warning';
`;

/**
 * 📊 SCHEMA CHANGE STORAGE RISK ANALYSIS
 * 
 * 1. Schema Change Storage Risk:
 *    - In CockroachDB, adding or dropping columns with default values or modifying data types
 *      can trigger a schema migration background job.
 *    - Schema changes are online, but index creations require table-scans which can impact performance.
 *    - Risk Mitigation: Always run schema migrations using 'ALTER TABLE ADD COLUMN' without non-constant defaults,
 *      or supply 'DEFAULT' during query runtime.
 * 
 * 2. Key Indexes Needed for SafetyLink Core:
 *    - CREATE INDEX IF NOT EXISTS idx_alerts_org_created ON alerts (organizationId, createdAt DESC);
 *    - CREATE INDEX IF NOT EXISTS idx_device_telemetry ON hardware_devices (deviceId, rssi);
 */
