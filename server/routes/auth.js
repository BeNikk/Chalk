// Addresses under /api/auth. Each line reads: method, path, checks to run, then the controller.

import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';
import {
  emailSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifySchema,
} from '../schemas/auth.js';
import {
  forgotPassword,
  login,
  logout,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} from '../controllers/auth.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/verify', validate(verifySchema), verifyEmail);
router.post('/resend-verification', authLimiter, validate(emailSchema), resendVerification);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, validate(emailSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
