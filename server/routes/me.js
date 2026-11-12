// Addresses under /api/me: the logged-in user's own account.

import { Router } from 'express';
import { requireSignIn } from '../middleware/requireSignIn.js';
import { uploadPhoto } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../schemas/users.js';
import { changeAvatar, getMe, removeAvatar, updateMe } from '../controllers/me.js';

const router = Router();

router.get('/', requireSignIn, getMe);
router.patch('/', requireSignIn, validate(updateMeSchema), updateMe);
router.put('/avatar', requireSignIn, uploadPhoto, changeAvatar);
router.delete('/avatar', requireSignIn, removeAvatar);

export default router;
