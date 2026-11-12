// Addresses under /api/users: public profiles.

import { Router } from 'express';
import { loadUserIfSignedIn } from '../middleware/requireSignIn.js';
import { getProfile, getUserPosts } from '../controllers/users.js';

const router = Router();

router.get('/:handle', getProfile);
router.get('/:handle/posts', loadUserIfSignedIn, getUserPosts);

export default router;
