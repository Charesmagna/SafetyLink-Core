import pool from '../config/db.js';

export async function getProfile(req, res) {
  const userId = req.params.userId || req.user.id;
  try {
    const [profRes, medRes, contRes] = await Promise.all([
      pool.query(
        `SELECT p.*, u.email, u.role, u.status FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1 AND (p.organization_id = $2 OR $3 = 'platform_owner')`,
        [userId, req.orgId, req.user.role]
      ),
      pool.query('SELECT * FROM medical_profiles WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY priority ASC', [userId]),
    ]);
    if (!profRes.rows[0]) return res.status(404).json({ error: 'Profile not found' });
    res.json({ ...profRes.rows[0], medical: medRes.rows[0] || {}, emergency_contacts: contRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateProfile(req, res) {
  const { display_name, bio, primary_phone, phone_2, phone_3, phone_4, photo_base64 } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO profiles (user_id, organization_id, display_name, bio, primary_phone, phone_2, phone_3, phone_4, photo_base64)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         bio          = COALESCE(EXCLUDED.bio, profiles.bio),
         primary_phone = COALESCE(EXCLUDED.primary_phone, profiles.primary_phone),
         phone_2      = COALESCE(EXCLUDED.phone_2, profiles.phone_2),
         phone_3      = COALESCE(EXCLUDED.phone_3, profiles.phone_3),
         phone_4      = COALESCE(EXCLUDED.phone_4, profiles.phone_4),
         photo_base64 = COALESCE(EXCLUDED.photo_base64, profiles.photo_base64),
         updated_at   = NOW()
       RETURNING *`,
      [req.user.id, req.orgId, display_name, bio || null, primary_phone || null, phone_2 || null, phone_3 || null, phone_4 || null, photo_base64 || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateMedical(req, res) {
  const { blood_type, conditions, medications, allergies, emergency_notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO medical_profiles (user_id, organization_id, blood_type, conditions, medications, allergies, emergency_notes, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         blood_type      = EXCLUDED.blood_type,
         conditions      = EXCLUDED.conditions,
         medications     = EXCLUDED.medications,
         allergies       = EXCLUDED.allergies,
         emergency_notes = EXCLUDED.emergency_notes,
         updated_at      = NOW()
       RETURNING *`,
      [req.user.id, req.orgId, blood_type || null, conditions || null, medications || null, allergies || null, emergency_notes || null]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function saveEmergencyContacts(req, res) {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: 'contacts must be an array' });
  try {
    await pool.query('DELETE FROM emergency_contacts WHERE user_id = $1', [req.user.id]);
    for (const [i, c] of contacts.slice(0, 5).entries()) {
      if (!c.name || !c.phone) continue;
      await pool.query(
        'INSERT INTO emergency_contacts (user_id, organization_id, name, relationship, phone, priority) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.user.id, req.orgId, c.name, c.relationship || null, c.phone, i + 1]
      );
    }
    res.json({ success: true, saved: Math.min(contacts.length, 5) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
