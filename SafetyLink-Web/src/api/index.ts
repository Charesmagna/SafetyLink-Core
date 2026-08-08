import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyToken } from './auth';

import loginRoute from './routes/login';
import registerRoute from './routes/register';
import usersRoute from './routes/users';
import locationRoute from './routes/location';
import panicRoute from './routes/panic';
import eventsRoute from './routes/events';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Auth Middleware for protected routes
app.use('/api/users/*', async (c, next) => await authMiddleware(c, next));
app.use('/api/events/*', async (c, next) => await authMiddleware(c, next));
app.use('/api/panic', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'PATCH' || c.req.path.includes('/resolve')) {
    return await authMiddleware(c, next);
  }
  return await next();
});

async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  c.set('orgId', payload.orgId);
  c.set('orgCode', payload.orgCode);
  await next();
}

app.route('/api/login', loginRoute);
app.route('/api/register', registerRoute);
app.route('/api/users', usersRoute);
app.route('/api/location', locationRoute);
app.route('/api/panic', panicRoute);
app.route('/api/events', eventsRoute);

export default app;
