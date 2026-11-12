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

// The people who liked a post, newest like first. Only public profile fields, never emails.
export async function listLikers(postId) {
  const likes = await prisma.like.findMany({
    where: { postId },
    orderBy: [{ createdAt: 'desc' }, { userId: 'desc' }],
    take: 100,
    select: { user: { select: { handle: true, avatarUrl: true } } },
  });
  return likes.map((like) => like.user);
}
