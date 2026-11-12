// Put this in front of any route that needs a logged-in user.
// It loads the user and puts them on `req.user` for the controller to use.
// New to sessions? See docs/help/sessions.md

import { findUserById } from '../models/users.js';

export async function requireSignIn(req, res, next) {
  const userId = req.session.userId;
  const user = userId ? await findUserById(userId) : null;

  if (!user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  req.user = user;
  next();
}
