// Post reading analytics (Glances): unique readers and total genuine reads.

import prisma from '../db.js';

// Repeated reads by the same reader within 15 minutes don't add to total reads.
export const GLANCE_COOLDOWN_MS = 15 * 60 * 1000;

export async function getGlanceStats(postIds) {
  if (postIds.length === 0) return new Map();

  const rows = await prisma.glance.groupBy({
    by: ['postId'],
    where: { postId: { in: postIds } },
    _count: { _all: true },
    _sum: { readCount: true },
  });

  const stats = new Map();
  for (const row of rows) {
    stats.set(row.postId, {
      glanceCount: row._count._all,
      totalGlances: row._sum.readCount ?? 0,
    });
  }
  return stats;
}

export async function getPostGlanceStats(postId) {
  const result = await prisma.glance.aggregate({
    where: { postId },
    _count: { _all: true },
    _sum: { readCount: true },
  });
  return {
    glanceCount: result._count._all,
    totalGlances: result._sum.readCount ?? 0,
  };
}

export async function recordGlance({ postId, userId = null, readerKey, now = new Date() }) {
  const existing = await prisma.glance.findUnique({
    where: { postId_readerKey: { postId, readerKey } },
  });

  if (!existing) {
    try {
      await prisma.glance.create({
        data: {
          postId,
          userId,
          readerKey,
          readCount: 1,
          firstReadAt: now,
          lastReadAt: now,
        },
      });
      return { counted: true, ...(await getPostGlanceStats(postId)) };
    } catch (error) {
      // Two simultaneous first-time glance requests from the same reader: only one creates the row.
      if (error?.code === 'P2002') {
        return { counted: false, reason: 'duplicate', ...(await getPostGlanceStats(postId)) };
      }
      throw error;
    }
  }

  if (now.getTime() - existing.lastReadAt.getTime() < GLANCE_COOLDOWN_MS) {
    return { counted: false, reason: 'cooldown', ...(await getPostGlanceStats(postId)) };
  }

  await prisma.glance.update({
    where: { id: existing.id },
    data: {
      readCount: { increment: 1 },
      lastReadAt: now,
    },
  });
  return { counted: true, ...(await getPostGlanceStats(postId)) };
}
