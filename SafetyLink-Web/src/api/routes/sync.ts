import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Sync batched offline data when connectivity is restored
app.post('/', async (c) => {
  const { org_code, phone, location_logs, emergency_sessions } = await c.req.json();
  
  if (!org_code || !phone) return c.json({ error: 'Missing credentials' }, 400);

  const user = await c.env.DB.prepare(`
    SELECT u.id, u.org_id, u.name FROM users u
    JOIN organizations o ON u.org_id = o.id
    WHERE o.org_code = ? AND u.phone = ?
  `).bind(org_code, phone).first();

  if (!user) return c.json({ error: 'User not found' }, 404);

  const statements = [];

  // Batch insert offline location logs (telemetry)
  if (Array.isArray(location_logs)) {
    for (const log of location_logs) {
      if (log.latitude && log.longitude) {
        statements.push(
          c.env.DB.prepare(
            'INSERT INTO node_telemetry (user_id, latitude, longitude, recorded_at) VALUES (?, ?, ?, ?)'
          ).bind(user.id, log.latitude, log.longitude, log.timestamp || new Date().toISOString())
        );
      }
    }
  }

  // Batch insert offline emergency sessions as events
  if (Array.isArray(emergency_sessions)) {
    for (const session of emergency_sessions) {
      statements.push(
        c.env.DB.prepare(
          'INSERT INTO events (org_id, type, user_name, description, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          user.org_id, 
          session.status === 'resolved' ? 'RESOLVED' : 'PANIC', 
          user.name, 
          `Offline recorded session (${session.sessionId})`, 
          session.startTime ? new Date(session.startTime).toISOString() : new Date().toISOString()
        )
      );
    }
  }

  if (statements.length > 0) {
    await c.env.DB.batch(statements);
  }

  return c.json({ success: true, synced_records: statements.length });
});

export default app;
