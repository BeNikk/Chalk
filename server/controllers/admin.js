// The admin's tools: choosing who the moderators are.

import { findUserByHandle, listModerators, setRole, toPublicProfile } from '../models/users.js';

export async function getModerators(req, res) {
  const moderators = await listModerators();
  res.json({ moderators: moderators.map(toPublicProfile) });
}

export async function addModerator(req, res) {
  const user = await findUserByHandle(req.params.handle.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Nobody has that handle.' });
  }
  if (user.role === 'ADMIN') {
    return res.status(400).json({ error: 'That’s the admin, who can already moderate.' });
  }

  const moderator = await setRole(user.id, 'MODERATOR');
  res.json({ moderator: toPublicProfile(moderator) });
}

export async function removeModerator(req, res) {
  const user = await findUserByHandle(req.params.handle.toLowerCase());
  if (!user || user.role !== 'MODERATOR') {
    return res.status(404).json({ error: 'That person isn’t a moderator.' });
  }

  await setRole(user.id, 'USER');
  res.json({ message: `@${user.handle} is no longer a moderator.` });
}
