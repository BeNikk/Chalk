// Addresses under /api/posts. Reading is open to everyone; writing needs an account.
// The whole API is listed in docs/help/api.md

import { Router } from 'express';
import { loadUserIfSignedIn, requireSignIn } from '../middleware/requireSignIn.js';
import { likeLimiter, writeLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';
import { createPostSchema } from '../schemas/posts.js';
import { createCommentSchema } from '../schemas/comments.js';
import {
  getFeed,
  getLikers,
  getPost,
  like,
  removePost,
  unlike,
  writePost,
} from '../controllers/posts.js';
import { getComments, writeComment } from '../controllers/comments.js';

const router = Router();

router.get('/', loadUserIfSignedIn, getFeed);
router.post('/', requireSignIn, writeLimiter, validate(createPostSchema), writePost);
router.get('/:id', loadUserIfSignedIn, getPost);
router.delete('/:id', requireSignIn, removePost);
router.get('/:id/likes', getLikers);
router.put('/:id/like', requireSignIn, likeLimiter, like);
router.delete('/:id/like', requireSignIn, likeLimiter, unlike);
router.get('/:id/comments', getComments);
router.post('/:id/comments', requireSignIn, writeLimiter, validate(createCommentSchema), writeComment);

export default router;
