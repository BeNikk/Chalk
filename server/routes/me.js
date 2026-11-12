// Addresses under /api/me: the logged-in user's own account.

import { Router } from 'express';
import { requireSignIn } from '../middleware/requireSignIn.js';
import { getMe } from '../controllers/me.js';

const router = Router();

router.get('/', requireSignIn, getMe);

export default router;
