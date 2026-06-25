import pool from '../config/db.js';
import { generateUniqueOrgCode } from '../services/org-code.service.js';
import { encryptJSON, decryptJSON } from '../services/crypto.service.js';

export async function createOrg(req, res) {
  const { organization_name, subscription_plan } = req.body;
  if (!organization_name?.trim()) return res.status(400).json({ error: 'organization_name required' });
  try {
    const code = await generateUniqueOrgCode();
    const { rows } = await pool.query(
      `INSERT INTO organizations (organization_name, organization_code, subscription_plan, owner_user_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [organization_name.trim(), code, subscription_plan || 'free', req.user?.id || null]
    );
    const org = rows[0];

    await pool.query(
      'INSERT INTO subscriptions (organization_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [org.id]
    );
    await pool.query(
      'INSERT INTO org_settings (organization_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [org.id]
    );

    res.status(201).json(org);
  } catch (err) {
    console.error('[org/create]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listOrgs(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT o.*,
              COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active') AS active_members,
              s.plan
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       LEFT JOIN subscriptions s ON s.organization_id = o.id
       GROUP BY o.id, s.plan
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getOrg(req, res) {
  const id = req.params.id || req.orgId;
  try {
    const { rows } = await pool.query(
      `SELECT o.*, s.plan, s.max_members, s.sms_enabled, s.whatsapp_enabled, s.voice_enabled
       FROM organizations o
       LEFT JOIN subscriptions s ON s.organization_id = o.id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Organisation not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateOrgSettings(req, res) {
  const orgId = req.orgId;
  const { sms_provider, sms_config, whatsapp_config, voice_config, escalation_delay_seconds, max_voice_contacts, map_center_lat, map_center_lng } = req.body;
  try {
    await pool.query(
      `INSERT INTO org_settings
         (organization_id, sms_provider, sms_config_encrypted, whatsapp_config_encrypted, voice_config_encrypted,
          escalation_delay_seconds, max_voice_contacts, map_center_lat, map_center_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (organization_id) DO UPDATE SET
         sms_provider                = COALESCE(EXCLUDED.sms_provider, org_settings.sms_provider),
         sms_config_encrypted        = COALESCE(EXCLUDED.sms_config_encrypted, org_settings.sms_config_encrypted),
         whatsapp_config_encrypted   = COALESCE(EXCLUDED.whatsapp_config_encrypted, org_settings.whatsapp_config_encrypted),
         voice_config_encrypted      = COALESCE(EXCLUDED.voice_config_encrypted, org_settings.voice_config_encrypted),
         escalation_delay_seconds    = COALESCE(EXCLUDED.escalation_delay_seconds, org_settings.escalation_delay_seconds),
         max_voice_contacts          = COALESCE(EXCLUDED.max_voice_contacts, org_settings.max_voice_contacts),
         map_center_lat              = COALESCE(EXCLUDED.map_center_lat, org_settings.map_center_lat),
         map_center_lng              = COALESCE(EXCLUDED.map_center_lng, org_settings.map_center_lng),
         updated_at                  = NOW()`,
      [
        orgId,
        sms_provider || null,
        sms_config   ? encryptJSON(sms_config) : null,
        whatsapp_config ? encryptJSON(whatsapp_config) : null,
        voice_config ? encryptJSON(voice_config) : null,
        escalation_delay_seconds || null,
        max_voice_contacts || null,
        map_center_lat || null,
        map_center_lng || null,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[org/settings]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function suspendOrg(req, res) {
  try {
    await pool.query(
      'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2',
      [req.body.status || 'suspended', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getOrgAnalytics(req, res) {
  const orgId = req.params.id || req.orgId;
  try {
    const [totals, byDay, smsStats, waStats, members] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='resolved') AS resolved,
                COUNT(*) FILTER (WHERE status='active') AS active,
                COUNT(*) FILTER (WHERE is_drill) AS drills,
                ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL)::numeric, 1) AS avg_resolve_min
         FROM alerts WHERE organization_id = $1`, [orgId]
      ),
      pool.query(`SELECT DATE(created_at) day, COUNT(*) cnt FROM alerts WHERE organization_id = $1 AND created_at > NOW()-INTERVAL '30 days' GROUP BY day ORDER BY day DESC`, [orgId]),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='sent') sent, COUNT(*) FILTER (WHERE status='failed') failed FROM sms_logs WHERE organization_id = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='sent') sent FROM whatsapp_logs WHERE organization_id = $1`, [orgId]),
      pool.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE status='active') active FROM users WHERE organization_id = $1`, [orgId]),
    ]);
    res.json({
      stats:       totals.rows[0],
      alertsByDay: byDay.rows,
      smsStats:    smsStats.rows[0],
      waStats:     waStats.rows[0],
      members:     members.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
