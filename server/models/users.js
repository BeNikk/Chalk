// Everything Chalk reads from or writes to the User table.

import prisma from '../db.js';

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserByHandle(handle) {
  return prisma.user.findUnique({ where: { handle } });
}

export function createUser({ email, handle, passwordHash }) {
  return prisma.user.create({ data: { email, handle, passwordHash } });
}

// Someone signing up again before verifying: their new details replace the old ones.
export function updateUnverifiedUser(userId, { handle, passwordHash }) {
  return prisma.user.update({ where: { id: userId }, data: { handle, passwordHash } });
}

export function markEmailVerified(userId, role) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date(), role },
  });
}

export function updatePassword(userId, passwordHash) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// What a user sees about their own account. Never includes the password hash.
export function toMyAccount(user) {
  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    bio: user.bio,
    theme: user.theme,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}
