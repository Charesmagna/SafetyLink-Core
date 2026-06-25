/**
 * 7-tier role hierarchy (highest → lowest):
 *   platform_owner > org_owner > org_admin > supervisor > responder > operator > member
 */

const ROLE_RANK = {
  platform_owner: 7,
  org_owner:      6,
  org_admin:      5,
  supervisor:     4,
  responder:      3,
  operator:       2,
  member:         1,
};

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error:    'Insufficient permissions',
        required: roles,
        current:  req.user.role,
      });
    }
    next();
  };
}

export function requireMinRole(minRole) {
  const minRank = ROLE_RANK[minRole] || 0;
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRank = ROLE_RANK[req.user.role] || 0;
    if (userRank < minRank) {
      return res.status(403).json({ error: 'Insufficient permissions', required: minRole });
    }
    next();
  };
}

export function isPlatformOwner(req) {
  return req.user?.role === 'platform_owner';
}

export function isAtLeast(req, minRole) {
  const minRank  = ROLE_RANK[minRole] || 0;
  const userRank = ROLE_RANK[req.user?.role] || 0;
  return userRank >= minRank;
}
