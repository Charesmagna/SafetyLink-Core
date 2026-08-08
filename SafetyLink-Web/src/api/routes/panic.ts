import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database }; Variables: { orgId: number } }>();

app.post('/', async (c) => {
  const { org_code, phone, latitude, longitude } = await c.req.json();
  
  const user = await c.env.DB.prepare(`
    SELECT u.id, u.org_id, u.name FROM users u
    JOIN organizations o ON u.org_id = o.id
    WHERE o.org_code = ? AND u.phone = ?
  `).bind(org_code, phone).first();

  if (!user) return c.json({ error: 'User not found' }, 404);

  await c.env.DB.prepare(
    'INSERT INTO panic_alerts (user_id, latitude, longitude) VALUES (?, ?, ?)'
  ).bind(user.id, latitude, longitude).run();

  await c.env.DB.prepare(
    'INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)'
  ).bind(user.org_id, 'PANIC', user.name, `Panic alert triggered at [${latitude}, ${longitude}]`).run();

  return c.json({ success: true });
});

app.get('/', async (c) => {
  const orgId = c.get('orgId');
  const { results } = await c.env.DB.prepare(`
    SELECT p.id, p.user_id, p.latitude, p.longitude, p.status, p.created_at, u.name, u.phone 
    FROM panic_alerts p
    JOIN users u ON p.user_id = u.id
    WHERE u.org_id = ? AND p.status = 'active'
  `).bind(orgId).all();

  return c.json({ panics: results });
});

app.post('/resolve', async (c) => {
  const orgId = c.get('orgId');
  const { panic_id } = await c.req.json();
  
  const panic = await c.env.DB.prepare(`
    SELECT p.id, u.name FROM panic_alerts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.id = ? AND u.org_id = ?
  `).bind(panic_id, orgId).first();

  if (!panic) return c.json({ error: 'Alert not found' }, 404);

  await c.env.DB.prepare(
    "UPDATE panic_alerts SET status = 'resolved' WHERE id = ?"
  ).bind(panic_id).run();

  await c.env.DB.prepare(
    'INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)'
  ).bind(orgId, 'RESOLVED', panic.name, 'Panic alert resolved by admin').run();

  return c.json({ success: true });
});

export default app;
