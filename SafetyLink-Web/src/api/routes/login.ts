import { Hono } from 'hono';
import { hashPassword, createToken } from '../auth';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.post('/', async (c) => {
  const { org_code, admin_password } = await c.req.json();
  if (!org_code || !admin_password) return c.json({ error: 'Missing credentials' }, 400);

  const hash = await hashPassword(admin_password);
  
  const org = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE org_code = ? AND admin_password_hash = ?'
  ).bind(org_code, hash).first();

  if (!org) {
    return c.json({ error: 'Invalid organization code or admin password' }, 401);
  }

  const token = await createToken(org.id as number, org.org_code as string);

  return c.json({
    token,
    org_name: org.org_name,
    org_code: org.org_code
  });
});

export default app;
