// Addresses under /api/comments. (Reading and writing comments lives under /api/posts/:id/comments.)

import { Router } from 'express';
import { requireSignIn } from '../middleware/requireSignIn.js';
import { removeComment } from '../controllers/comments.js';

const router = Router();

router.delete('/:id', requireSignIn, removeComment);

export default router;
