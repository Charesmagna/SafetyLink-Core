import { Router }       from 'express';
import { body }         from 'express-validator';
import bcrypt           from 'bcryptjs';
import pool             from '../db/index.js';
import { signToken }    from '../services/jwt.service.js';
import { authLimiter }  from '../middleware/ratelimit.middleware.js';
import { validate }     from '../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

/* ──────────────────────────────────────
   POST /api/auth/register
────────────────────────────────────── */
router.post('/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('org_code').trim().notEmpty().withMessage('Org code is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    const { name, phone, org_code, password, role } = req.body;
    const orgCode = org_code.toUpperCase().trim();

    try {
      const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length) return res.status(409).json({ error: 'Phone number already registered' });

      await pool.query(
        'INSERT INTO organizations (org_code) VALUES ($1) ON CONFLICT DO NOTHING',
        [orgCode]
      );

      const passwordHash = await bcrypt.hash(password, 12);
      const safeRole     = ['operator', 'responder', 'supervisor'].includes(role) ? role : 'operator';

      const { rows } = await pool.query(
        `INSERT INTO users (org_code, name, phone, password_hash, role, active)
         VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id, name, phone, org_code, role, created_at`,
        [orgCode, name.trim(), phone.trim(), passwordHash, safeRole]
      );

      await pool.query(
        'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
        [orgCode, phone, 'user_registered', `${name} (${safeRole})`]
      );

      res.status(201).json({ message: 'Registration successful', user: rows[0] });
    } catch (err) {
      console.error('[auth/register]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ──────────────────────────────────────
   POST /api/auth/login
────────────────────────────────────── */
router.post('/login',
  authLimiter,
  [
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const { phone, password } = req.body;

    try {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE phone = $1 AND active = TRUE',
        [phone.trim()]
      );
      const user = rows[0];

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      let valid = false;
      if (user.password_hash) {
        valid = await bcrypt.compare(password, user.password_hash);
      } else {
        // Legacy: org_code as password (auto-migrates on login)
        valid = password.toUpperCase() === user.org_code;
        if (valid) {
          const hash = await bcrypt.hash(password, 12);
          await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
        }
      }

      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken({ userId: user.id, orgCode: user.org_code, role: user.role });
      await pool.query('UPDATE users SET token = $1, last_login = NOW() WHERE id = $2', [token, user.id]);

      await pool.query(
        'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
        [user.org_code, user.phone, 'user_login', `Role: ${user.role}`]
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, phone: user.phone, org_code: user.org_code, role: user.role },
      });
    } catch (err) {
      console.error('[auth/login]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ──────────────────────────────────────
   POST /api/auth/verify
────────────────────────────────────── */
router.post('/verify', requireAuth, (req, res) => {
  const { id, name, phone, org_code, role } = req.user;
  res.json({ valid: true, user: { id, name, phone, org_code, role } });
});

/* ──────────────────────────────────────
   GET /api/auth/users  (admin / supervisor)
────────────────────────────────────── */
router.get('/users', requireAuth, requireRole('admin', 'supervisor'), async (req, res) => {
  const orgCode = req.user.role === 'admin' ? req.query.org : req.user.org_code;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone, org_code, role, active, last_login, created_at
       FROM users WHERE org_code = $1 ORDER BY created_at DESC`,
      [orgCode || req.user.org_code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   PATCH /api/auth/users/:id/role  (admin)
────────────────────────────────────── */
router.patch('/users/:id/role', requireAuth, requireRole('admin', 'supervisor'), async (req, res) => {
  const { role } = req.body;
  const allowed  = ['operator', 'responder', 'supervisor', 'admin'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role',
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
