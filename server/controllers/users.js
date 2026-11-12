// Public profiles: anyone can see a user's handle, photo, bio, theme, posts, followers and following.
// Never their email.

import { readId } from '../middleware/validate.js';
import { findProfile, findUserByHandle, toPublicProfile } from '../models/users.js';
import { listPosts } from '../models/posts.js';
import {
  countFollowers,
  follow,
  isFollowing,
  listFollowers,
  listFollowing,
  unfollow,
} from '../models/follows.js';

const USER_NOT_FOUND = { error: 'Nobody has that handle.' };

function findByHandleInAddress(req) {
  return findUserByHandle(req.params.handle.toLowerCase());
}

export async function getProfile(req, res) {
  const user = await findProfile(req.params.handle.toLowerCase());
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  const followedByMe = req.user ? await isFollowing(req.user.id, user.id) : false;
  res.json({ user: { ...toPublicProfile(user), followedByMe } });
}

// GET /api/users/inkyfox/posts?before=42
export async function getUserPosts(req, res) {
  const user = await findByHandleInAddress(req);
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }

  const before = readId(req.query.before) ?? undefined;
  const posts = await listPosts({ authorId: user.id, before, viewerId: req.user?.id });
  res.json({ posts });
}

// PUT /api/users/inkyfox/follow
export async function followUser(req, res) {
  const user = await findByHandleInAddress(req);
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  if (user.id === req.user.id) {
    return res.status(400).json({ error: "You can't follow yourself." });
  }
  await follow(req.user.id, user.id);
  res.json({ followerCount: await countFollowers(user.id), followedByMe: true });
}

export async function unfollowUser(req, res) {
  const user = await findByHandleInAddress(req);
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  await unfollow(req.user.id, user.id);
  res.json({ followerCount: await countFollowers(user.id), followedByMe: false });
}

export async function getFollowers(req, res) {
  const user = await findByHandleInAddress(req);
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  res.json({ people: await listFollowers(user.id) });
}

export async function getFollowing(req, res) {
  const user = await findByHandleInAddress(req);
  if (!user) {
    return res.status(404).json(USER_NOT_FOUND);
  }
  res.json({ people: await listFollowing(user.id) });
}
