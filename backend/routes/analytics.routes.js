import { Router } from 'express';
import pool       from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const orgCode = req.user.role === 'admin'
    ? (req.query.org || req.user.org_code)
    : req.user.org_code;

  try {
    const [totals, byDay, topResponders, audit, smsStats, waStats] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                          AS total,
           COUNT(*) FILTER (WHERE status = 'resolved')      AS resolved,
           COUNT(*) FILTER (WHERE status = 'active')        AS active,
           COUNT(*) FILTER (WHERE is_drill = TRUE)          AS drills,
           AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
             FILTER (WHERE resolved_at IS NOT NULL)         AS avg_resolution_minutes
         FROM alerts WHERE org_code = $1`,
        [orgCode]
      ),
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM alerts WHERE org_code = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day DESC`,
        [orgCode]
      ),
      pool.query(
        `SELECT r.responder_name, r.responder_phone, COUNT(*) AS responses
         FROM responders r
         JOIN alerts a ON a.id = r.alert_id
         WHERE a.org_code = $1
         GROUP BY r.responder_name, r.responder_phone
         ORDER BY responses DESC LIMIT 10`,
        [orgCode]
      ),
      pool.query(
        `SELECT action, detail, operator_phone, created_at
         FROM audit_log WHERE org_code = $1
         ORDER BY created_at DESC LIMIT 100`,
        [orgCode]
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'sent')   AS sent,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed
         FROM sms_logs WHERE org_code = $1`,
        [orgCode]
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'sent')   AS sent,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed
         FROM whatsapp_logs WHERE org_code = $1`,
        [orgCode]
      ),
    ]);

    res.json({
      stats:          { ...totals.rows[0], avg_resolution_minutes: parseFloat(totals.rows[0].avg_resolution_minutes || 0).toFixed(1) },
      alertsByDay:    byDay.rows,
      topResponders:  topResponders.rows,
      auditLog:       audit.rows,
      smsStats:       smsStats.rows[0],
      whatsappStats:  waStats.rows[0],
    });
  } catch (err) {
    console.error('[analytics]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
