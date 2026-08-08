import { Hono } from 'hono';
import { hashPassword } from '../auth';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.post('/', async (c) => {
  const { org_code, name, phone, password } = await c.req.json();
  if (!org_code || !name || !phone || !password) return c.json({ error: 'Missing fields' }, 400);

  const org = await c.env.DB.prepare('SELECT id FROM organizations WHERE org_code = ?')
    .bind(org_code).first();

  if (!org) return c.json({ error: 'Organization not found' }, 404);

  const password_hash = await hashPassword(password);

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO users (org_id, name, phone, password_hash) VALUES (?, ?, ?, ?) RETURNING id'
    ).bind(org.id, name, phone, password_hash).first();

    await c.env.DB.prepare(
      'INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)'
    ).bind(org.id, 'REGISTRATION', name, `New user ${name} registered from APK`).run();

    return c.json({ success: true, user_id: result?.id });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) {
      return c.json({ error: 'Phone number already registered' }, 400);
    }
    return c.json({ error: 'Registration failed' }, 500);
  }
});

export default app;
