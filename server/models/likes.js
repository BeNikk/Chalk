// The Like table: one row per person per liked post.

import prisma from '../db.js';

// skipDuplicates: if you already liked it, nothing happens. So liking twice is harmless.
export function likePost(userId, postId) {
  return prisma.like.createMany({ data: [{ userId, postId }], skipDuplicates: true });
}

export function unlikePost(userId, postId) {
  return prisma.like.deleteMany({ where: { userId, postId } });
}

export function countLikes(postId) {
  return prisma.like.count({ where: { postId } });
}
