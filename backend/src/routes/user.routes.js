import { Router } from 'express';
import { listUsers, approveUser, updateUserRole, suspendUser, getPendingUsers } from '../controllers/user.controller.js';
import { getProfile, updateProfile, updateMedical, saveEmergencyContacts } from '../controllers/profile.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { extractTenant } from '../middleware/tenant.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';

const router   = Router();
const auth     = [verifyToken, requireAuth, extractTenant];

router.get('/',                     ...auth, requireMinRole('supervisor'), listUsers);
router.get('/pending',              ...auth, requireMinRole('org_admin'), getPendingUsers);
router.put('/:id/approve',          ...auth, requireMinRole('org_admin'), approveUser);
router.put('/:id/role',             ...auth, requireMinRole('org_admin'), updateUserRole);
router.put('/:id/status',           ...auth, requireMinRole('org_admin'), suspendUser);

router.get('/profile',              ...auth, getProfile);
router.put('/profile',              ...auth, updateProfile);
router.put('/profile/medical',      ...auth, updateMedical);
router.put('/profile/contacts',     ...auth, saveEmergencyContacts);
router.get('/profile/:userId',      ...auth, requireMinRole('supervisor'), getProfile);

export default router;
