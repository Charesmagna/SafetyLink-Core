import { Router } from 'express';
import { create, list, get, accept, escalate, resolve, streamLocation } from '../controllers/alert.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { extractTenant } from '../middleware/tenant.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';
import { alertValidators, validate } from '../middleware/validate.middleware.js';

const router = Router();
const auth   = [verifyToken, requireAuth, extractTenant];

router.post('/',                    ...auth, alertValidators, validate, create);
router.get('/',                     ...auth, requireMinRole('operator'), list);
router.get('/:id',                  ...auth, requireMinRole('member'),   get);
router.post('/:id/accept',          ...auth, requireMinRole('responder'), accept);
router.post('/:id/escalate',        ...auth, requireMinRole('supervisor'), escalate);
router.post('/:id/resolve',         ...auth, requireMinRole('supervisor'), resolve);
router.post('/location/stream',     ...auth, streamLocation);

export default router;
