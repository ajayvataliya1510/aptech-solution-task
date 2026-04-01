import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { loginLimiter, registerLimiter, refreshLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);

export default router;
