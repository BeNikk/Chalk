// Everything Chalk reads from or writes to the Comment table.

import prisma from '../db.js';

const withAuthor = { author: { select: { handle: true, avatarUrl: true } } };

function toPublicComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    body: comment.body,
    createdAt: comment.createdAt,
    author: comment.author,
  };
}

// Oldest first, so a conversation reads top to bottom.
export async function listComments(postId) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { id: 'asc' },
    include: withAuthor,
  });
  return comments.map(toPublicComment);
}

export async function createComment({ postId, authorId, body }) {
  const comment = await prisma.comment.create({
    data: { postId, authorId, body },
    include: withAuthor,
  });
  return toPublicComment(comment);
}

// Just the author's id: enough to check who may delete the comment.
export function findCommentAuthorId(id) {
  return prisma.comment.findUnique({ where: { id }, select: { authorId: true } });
}

export function deleteComment(id) {
  return prisma.comment.delete({ where: { id } });
}
