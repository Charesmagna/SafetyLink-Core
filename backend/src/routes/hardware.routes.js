import { Router } from 'express';
import { register, calibrate, list, assign, remove } from '../controllers/hardware.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { extractTenant } from '../middleware/tenant.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';

const router = Router();
const auth   = [verifyToken, requireAuth, extractTenant];

router.get('/',               ...auth, list);
router.post('/register',      ...auth, requireMinRole('org_admin'), register);
router.post('/calibrate',     ...auth, requireMinRole('org_admin'), calibrate);
router.put('/:id/assign',     ...auth, requireMinRole('org_admin'), assign);
router.delete('/:id',         ...auth, requireMinRole('org_admin'), remove);

export default router;
