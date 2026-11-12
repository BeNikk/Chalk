// Public profiles: anyone can see a user's handle, photo, bio, theme and posts. Never their email.

import { readId } from '../middleware/validate.js';
import { findUserByHandle, toPublicProfile } from '../models/users.js';
import { listPosts } from '../models/posts.js';

const USER_NOT_FOUND = { error: 'Nobody has that handle.' };

export async function getProfile(req, res) {
  const user = await findUserByHandle(req.params.handle.toLowerCase());
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  res.json({ user: toPublicProfile(user) });
}

// GET /api/users/inkyfox/posts?before=42
export async function getUserPosts(req, res) {
  const user = await findUserByHandle(req.params.handle.toLowerCase());
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }

  const before = readId(req.query.before) ?? undefined;
  const posts = await listPosts({ authorId: user.id, before, viewerId: req.user?.id });
  res.json({ posts });
}
