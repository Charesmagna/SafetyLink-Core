import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import pool, { runMigrations } from './config/db.js';
import { initSocket } from './websocket/socket.server.js';

import authRoutes         from './routes/auth.routes.js';
import alertRoutes        from './routes/alert.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import userRoutes         from './routes/user.routes.js';
import hardwareRoutes     from './routes/hardware.routes.js';
import webhookRoutes      from './routes/webhook.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../..');

const app        = express();
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────
initSocket(httpServer);

// ── Security middleware ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'unpkg.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
      imgSrc:     ["'self'", 'data:', 'tile.openstreetmap.org', '*.openstreetmap.org'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc:    ["'self'", 'fonts.gstatic.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: ENV.CORS_ORIGINS === '*' ? '*' : ENV.CORS_ORIGINS.split(',') }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/alerts',        alertRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/hardware',      hardwareRoutes);
app.use('/api/webhooks',      webhookRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try { await pool.query('SELECT 1'); dbOk = true; } catch {}
  res.json({ status: 'online', version: '5.0.0', db: dbOk ? 'connected' : 'error' });
});

// ── Static files ──────────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(ROOT, 'admin')));
app.use(express.static(path.join(ROOT, 'www')));

// ── SPA fallback ──────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(ROOT, 'admin', 'index.html'));
  }
  res.sendFile(path.join(ROOT, 'www', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Boot ──────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await runMigrations();
    httpServer.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`[SAFETY-LINK v5.0] running on port ${ENV.PORT}`);
    });
  } catch (err) {
    console.error('[BOOT FATAL]', err.message);
    process.exit(1);
  }
}

boot();

export default app;
