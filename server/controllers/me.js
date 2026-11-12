// The logged-in user's own account: reading it, changing the bio and theme, and the profile photo.

import { toMyAccount, updateAvatar, updateProfile } from '../models/users.js';
import { deletePhoto, savePhoto } from '../services/photos.js';

export function getMe(req, res) {
  res.json({ user: toMyAccount(req.user) });
}

export async function updateMe(req, res) {
  const { bio, theme } = req.body;
  const user = await updateProfile(req.user.id, { bio, theme });
  res.json({ user: toMyAccount(user) });
}

export async function changeAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose a photo first.' });
  }

  const photo = await savePhoto(req.file, req.user.id);
  const user = await updateAvatar(req.user.id, { avatarUrl: photo.url, avatarId: photo.id });
  // Only after the new one is saved, so you're never left with a broken photo.
  await deleteOldPhoto(req.user.avatarId);

  res.json({ user: toMyAccount(user) });
}

export async function removeAvatar(req, res) {
  const user = await updateAvatar(req.user.id, { avatarUrl: null, avatarId: null });
  await deleteOldPhoto(req.user.avatarId);
  res.json({ user: toMyAccount(user) });
}

// If deleting the old file fails, the change still worked; a leftover file is harmless.
async function deleteOldPhoto(photoId) {
  if (!photoId) return;
  try {
    await deletePhoto(photoId);
  } catch (error) {
    console.error('Could not delete old photo:', error);
  }
}
