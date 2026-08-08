import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database }; Variables: { orgId: number } }>();

app.get('/', async (c) => {
  const orgId = c.get('orgId');
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM events 
    WHERE org_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).bind(orgId).all();

  return c.json({ events: results });
});

export default app;
