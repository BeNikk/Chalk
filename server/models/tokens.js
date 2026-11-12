// The EmailToken table: one row per "verify your email" or "reset your password" link.

import prisma from '../db.js';

export function saveEmailToken({ userId, purpose, tokenHash, expiresAt }) {
  return prisma.emailToken.create({ data: { userId, purpose, tokenHash, expiresAt } });
}

// Marks a token as used and returns it, or returns null if it's unknown, expired or already used.
// The check and the marking happen in one database step, so two clicks at once can't both succeed.
export async function useEmailToken(tokenHash, purpose) {
  const { count } = await prisma.emailToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;
  return prisma.emailToken.findUnique({ where: { tokenHash } });
}

// Older links stop working once a newer one is sent or a password is reset.
export function deleteUnusedEmailTokens(userId, purpose) {
  return prisma.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } });
}
