import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database }; Variables: { orgId: number } }>();

app.get('/', async (c) => {
  const orgId = c.get('orgId');
  const { results } = await c.env.DB.prepare(`
    SELECT u.id, u.name, u.phone, u.latitude, u.longitude, u.created_at, p.status as panic_status 
    FROM users u
    LEFT JOIN panic_alerts p ON u.id = p.user_id AND p.status = 'active'
    WHERE u.org_id = ?
  `).bind(orgId).all();

  return c.json({ users: results });
});

export default app;
