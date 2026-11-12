// The Follow table: one row per person following another.

import prisma from '../db.js';

// skipDuplicates: following twice is harmless, like liking twice.
export function follow(followerId, followingId) {
  return prisma.follow.createMany({ data: [{ followerId, followingId }], skipDuplicates: true });
}

export function unfollow(followerId, followingId) {
  return prisma.follow.deleteMany({ where: { followerId, followingId } });
}

export function countFollowers(userId) {
  return prisma.follow.count({ where: { followingId: userId } });
}

export async function isFollowing(followerId, followingId) {
  const count = await prisma.follow.count({ where: { followerId, followingId } });
  return count > 0;
}

const PERSON = { select: { handle: true, avatarUrl: true } };
const NEWEST_FIRST = [{ createdAt: 'desc' }, { followerId: 'desc' }, { followingId: 'desc' }];

// Newest first, up to 100. Only public profile fields, never emails.
export async function listFollowers(userId) {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: NEWEST_FIRST,
    take: 100,
    select: { follower: PERSON },
  });
  return rows.map((row) => row.follower);
}

export async function listFollowing(userId) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: NEWEST_FIRST,
    take: 100,
    select: { following: PERSON },
  });
  return rows.map((row) => row.following);
}
