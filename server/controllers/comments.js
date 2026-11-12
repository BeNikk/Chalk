// Reading, writing and deleting comments on a post.

import { readId } from '../middleware/validate.js';
import { postExists } from '../models/posts.js';
import { createComment, deleteComment, findCommentAuthorId, listComments } from '../models/comments.js';
import { canModerate } from '../models/users.js';

const POST_NOT_FOUND = { error: 'That post does not exist (or was deleted).' };

// The post id from the address, but only if that post exists. Otherwise null.
async function existingPostId(req) {
  const id = readId(req.params.id);
  if (!id || !(await postExists(id))) return null;
  return id;
}

export async function getComments(req, res) {
  const postId = await existingPostId(req);
  if (!postId) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  res.json({ comments: await listComments(postId) });
}

export async function writeComment(req, res) {
  const postId = await existingPostId(req);
  if (!postId) {
    return res.status(404).json(POST_NOT_FOUND);
  }
  const comment = await createComment({ postId, authorId: req.user.id, body: req.body.body });
  res.status(201).json({ comment });
}

export async function removeComment(req, res) {
  const id = readId(req.params.id);
  const comment = id ? await findCommentAuthorId(id) : null;
  if (!comment) {
    return res.status(404).json({ error: 'That comment does not exist (or was deleted).' });
  }

  const isAuthor = comment.authorId === req.user.id;
  if (!isAuthor && !canModerate(req.user)) {
    return res.status(403).json({ error: 'You can only delete your own comments.' });
  }

  await deleteComment(id);
  res.json({ message: 'Comment deleted.' });
}
