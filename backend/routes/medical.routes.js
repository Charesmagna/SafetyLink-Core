import { Router } from 'express';
import { body }   from 'express-validator';
import pool       from '../db/index.js';
import { requireAuth }  from '../middleware/auth.middleware.js';
import { validate }     from '../middleware/validate.middleware.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM medical_profiles WHERE phone = $1',
      [req.user.phone]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/',
  requireAuth,
  [
    body('blood_type').optional().trim(),
    body('conditions').optional().trim(),
    body('medications').optional().trim(),
    body('allergies').optional().trim(),
    body('emergency_notes').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { blood_type, conditions, medications, allergies, emergency_notes } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO medical_profiles (phone, blood_type, conditions, medications, allergies, emergency_notes, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (phone) DO UPDATE SET
           blood_type      = EXCLUDED.blood_type,
           conditions      = EXCLUDED.conditions,
           medications     = EXCLUDED.medications,
           allergies       = EXCLUDED.allergies,
           emergency_notes = EXCLUDED.emergency_notes,
           updated_at      = NOW()
         RETURNING *`,
        [req.user.phone, blood_type || null, conditions || null,
         medications || null, allergies || null, emergency_notes || null]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error('[medical/save]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ── GET /api/medical/:phone  — responder lookup during active alert ── */
router.get('/:phone', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT blood_type, conditions, medications, allergies, emergency_notes FROM medical_profiles WHERE phone = $1',
      [req.params.phone]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No medical profile found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
