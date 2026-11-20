// The feed, single posts, writing, editing, deleting posts, likes, and Glances.

import { readId } from '../middleware/validate.js';
import { LABELS } from '../schemas/posts.js';
import {
  createPost,
  deletePost,
  findPost,
  findPostAuthorId,
  listPosts,
  postExists,
  updatePost,
} from '../models/posts.js';
import { countLikes, likePost, listLikers, unlikePost } from '../models/likes.js';
import { getPostGlanceStats, recordGlance } from '../models/glances.js';
import { canModerate } from '../models/users.js';
import { ensureVisitorCookie, getReaderIdentity } from '../services/glances.js';

const POST_NOT_FOUND = { error: 'That post does not exist (or was deleted).' };

// The post id from the address, but only if that post exists. Otherwise null.
async function existingPostId(req) {
  const id = readId(req.params.id);
  if (!id || !(await postExists(id))) return null;
  return id;
}

// GET /api/posts?label=rant&before=42, or ?following=true for posts by people you follow
export async function getFeed(req, res) {
  const { label } = req.query;
  if (label && !LABELS.includes(label)) {
    return res.status(400).json({ error: `Unknown label. Use one of: ${LABELS.join(', ')}.` });
  }
  const following = req.query.following === 'true';
  if (following && !req.user) {
    return res.status(401).json({ error: 'Log in to see posts from people you follow.' });
  }
  const before = readId(req.query.before) ?? undefined;

  const posts = await listPosts({
    label,
    before,
    viewerId: req.user?.id,
    followedBy: following ? req.user.id : undefined,
  });
  res.json({ posts });
}

export async function getPost(req, res) {
  const id = readId(req.params.id);
  const post = id ? await findPost(id, req.user?.id) : null;
  if (!post) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  ensureVisitorCookie(req, res);
  res.json({ post });
}

export async function writePost(req, res) {
  const { label, title, body } = req.body;
  const post = await createPost({ authorId: req.user.id, label, title, body });
  res.status(201).json({ post });
}

export async function editPost(req, res) {
  const id = readId(req.params.id);
  const existing = id ? await findPostAuthorId(id) : null;
  if (!existing) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  if (existing.authorId !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own posts.' });
  }

  const post = await updatePost(id, req.body, req.user.id);
  res.json({ post });
}

export async function removePost(req, res) {
  const id = readId(req.params.id);
  const post = id ? await findPostAuthorId(id) : null;
  if (!post) {
    return res.status(404).json(POST_NOT_FOUND);
  }

  const isAuthor = post.authorId === req.user.id;
  if (!isAuthor && !canModerate(req.user)) {
    return res.status(403).json({ error: 'You can only delete your own posts.' });
  }

  await deletePost(id);
  res.json({ message: 'Post deleted.' });
}

// POST /api/posts/:id/glance: record a genuine read after the client's engagement threshold.
export async function recordPostGlance(req, res) {
  const id = readId(req.params.id);
  const post = id ? await findPostAuthorId(id) : null;
  if (!post) {
    return res.status(404).json(POST_NOT_FOUND);
  }

  // Never count the author's own views as reads.
  if (req.user && req.user.id === post.authorId) {
    const stats = await getPostGlanceStats(id);
    return res.json({ counted: false, reason: 'author', ...stats });
  }

  const { userId, readerKey } = getReaderIdentity(req, res);
  const result = await recordGlance({ postId: id, userId, readerKey });
  res.json(result);
}

export async function like(req, res) {
  const id = await existingPostId(req);
  if (!id) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  await likePost(req.user.id, id);
  res.json({ likeCount: await countLikes(id), likedByMe: true });
}

export async function unlike(req, res) {
  const id = await existingPostId(req);
  if (!id) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  await unlikePost(req.user.id, id);
  res.json({ likeCount: await countLikes(id), likedByMe: false });
}

// GET /api/posts/:id/likes: who liked it
export async function getLikers(req, res) {
  const id = await existingPostId(req);
  if (!id) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  res.json({ people: await listLikers(id) });
}
