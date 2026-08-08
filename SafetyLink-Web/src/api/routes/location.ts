import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.post('/', async (c) => {
  const { org_code, phone, latitude, longitude } = await c.req.json();
  if (!org_code || !phone || latitude === undefined || longitude === undefined) return c.json({ error: 'Missing fields' }, 400);

  const user = await c.env.DB.prepare(`
    SELECT u.id, u.org_id FROM users u
    JOIN organizations o ON u.org_id = o.id
    WHERE o.org_code = ? AND u.phone = ?
  `).bind(org_code, phone).first();

  if (!user) return c.json({ error: 'User not found' }, 404);

  await c.env.DB.prepare(
    'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?'
  ).bind(latitude, longitude, user.id).run();

  return c.json({ success: true });
});

export default app;
