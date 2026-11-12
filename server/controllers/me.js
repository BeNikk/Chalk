// The logged-in user's own account.

import { toMyAccount } from '../models/users.js';

export function getMe(req, res) {
  res.json({ user: toMyAccount(req.user) });
}
