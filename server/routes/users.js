// Addresses under /api/users: public profiles, and following people.

import { Router } from 'express';
import { loadUserIfSignedIn, requireSignIn } from '../middleware/requireSignIn.js';
import { likeLimiter } from '../middleware/rateLimits.js';
import {
  followUser,
  getFollowers,
  getFollowing,
  getProfile,
  getUserPosts,
  unfollowUser,
} from '../controllers/users.js';

const router = Router();

router.get('/:handle', loadUserIfSignedIn, getProfile);
router.get('/:handle/posts', loadUserIfSignedIn, getUserPosts);
router.get('/:handle/followers', getFollowers);
router.get('/:handle/following', getFollowing);
router.put('/:handle/follow', requireSignIn, likeLimiter, followUser);
router.delete('/:handle/follow', requireSignIn, likeLimiter, unfollowUser);

export default router;
