import pool from '../config/db.js';

/**
 * Ensures req.orgId is set and that the requesting user belongs to that org
 * (unless they are a platform_owner).
 */
export function extractTenant(req, res, next) {
  const orgId = req.user?.organization_id;
  if (!orgId && req.user?.role !== 'platform_owner') {
    return res.status(400).json({ error: 'User has no organisation assigned' });
  }
  req.orgId = orgId;
  next();
}

export function requireSameOrg(req, res, next) {
  const { orgId } = req.params;
  if (req.user?.role === 'platform_owner') return next();
  if (orgId && orgId !== req.user?.organization_id) {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }
  next();
}

export async function loadOrgSettings(req, res, next) {
  const orgId = req.orgId || req.user?.organization_id;
  if (!orgId) return next();
  try {
    const { rows } = await pool.query(
      'SELECT * FROM org_settings WHERE organization_id = $1',
      [orgId]
    );
    req.orgSettings = rows[0] || null;
  } catch {
    req.orgSettings = null;
  }
  next();
}
