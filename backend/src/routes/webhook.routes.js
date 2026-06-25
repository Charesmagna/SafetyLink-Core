import { Router } from 'express';
import { twimlWebhook } from '../controllers/voice.controller.js';
import { send as sendSMS } from '../controllers/sms.controller.js';
import { send as sendWA }  from '../controllers/whatsapp.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { extractTenant } from '../middleware/tenant.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';

const router = Router();
const auth   = [verifyToken, requireAuth, extractTenant];

router.get('/voice-twiml', twimlWebhook);
router.post('/sms/send',   ...auth, requireMinRole('supervisor'), sendSMS);
router.post('/wa/send',    ...auth, requireMinRole('supervisor'), sendWA);

export default router;
