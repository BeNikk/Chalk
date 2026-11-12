// Addresses under /api/admin: tools only the admin can use.

import { Router } from 'express';
import { requireAdmin, requireSignIn } from '../middleware/requireSignIn.js';
import { addModerator, getModerators, removeModerator } from '../controllers/admin.js';

const router = Router();

// Every route below needs a logged-in admin.
router.use(requireSignIn, requireAdmin);

router.get('/moderators', getModerators);
router.put('/moderators/:handle', addModerator);
router.delete('/moderators/:handle', removeModerator);

export default router;
