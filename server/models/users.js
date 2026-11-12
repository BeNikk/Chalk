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

// A user with how many followers they have and how many people they follow, for their profile.
export function findProfile(handle) {
  return prisma.user.findUnique({
    where: { handle },
    include: { _count: { select: { followers: true, following: true } } },
  });
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

export function updateProfile(userId, { bio, theme }) {
  return prisma.user.update({ where: { id: userId }, data: { bio, theme } });
}

export function updateAvatar(userId, { avatarUrl, avatarId }) {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl, avatarId } });
}

export function setRole(userId, role) {
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export function listModerators() {
  return prisma.user.findMany({ where: { role: 'MODERATOR' }, orderBy: { handle: 'asc' } });
}

// Moderators and the admin can remove anyone's posts and comments.
export function canModerate(user) {
  return user.role === 'MODERATOR' || user.role === 'ADMIN';
}

// What anyone can see about a user. No email: that stays private.
export function toPublicProfile(user) {
  return {
    handle: user.handle,
    bio: user.bio,
    theme: user.theme,
    avatarUrl: user.avatarUrl,
    role: user.role,
    joinedAt: user.createdAt,
    followerCount: user._count?.followers,
    followingCount: user._count?.following,
  };
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
