import { Router } from 'express';
import { createOrg, listOrgs, getOrg, updateOrgSettings, suspendOrg, getOrgAnalytics } from '../controllers/organization.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { extractTenant } from '../middleware/tenant.middleware.js';
import { requireRole, requireMinRole } from '../middleware/role.middleware.js';

const router = Router();
const auth   = [verifyToken, requireAuth];

router.post('/',                requireRole('platform_owner'), createOrg);
router.get('/',                 ...auth, requireRole('platform_owner'), listOrgs);
router.get('/mine',             ...auth, extractTenant, getOrg);
router.get('/:id',              ...auth, requireRole('platform_owner'), getOrg);
router.put('/mine/settings',    ...auth, extractTenant, requireMinRole('org_admin'), updateOrgSettings);
router.put('/:id/status',       ...auth, requireRole('platform_owner'), suspendOrg);
router.get('/mine/analytics',   ...auth, extractTenant, requireMinRole('supervisor'), getOrgAnalytics);
router.get('/:id/analytics',    ...auth, requireRole('platform_owner'), getOrgAnalytics);

export default router;
