import { Router } from 'express';
import { register, login, refresh, logout, me, updateFcmToken } from '../controllers/auth.controller.js';
import { verifyToken, requireAuth } from '../middleware/auth.middleware.js';
import { authValidators, validate } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/register', authValidators.register, validate, register);
router.post('/login',    authValidators.login,    validate, login);
router.post('/refresh',  refresh);
router.post('/logout',   verifyToken, requireAuth, logout);
router.get('/me',        verifyToken, requireAuth, me);
router.post('/fcm-token', verifyToken, requireAuth, updateFcmToken);

export default router;
