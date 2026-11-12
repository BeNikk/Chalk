// Find out who's logged in, and put them on `req.user` for the controller to use.
// New to sessions? See docs/help/sessions.md

import { findUserById } from '../models/users.js';

async function findLoggedInUser(req) {
  const userId = req.session.userId;
  return userId ? findUserById(userId) : null;
}

// For pages anyone can see, but that show a bit more when you're logged in (like your own likes).
export async function loadUserIfSignedIn(req, res, next) {
  req.user = await findLoggedInUser(req);
  next();
}

// For actions that need an account, like posting or liking.
export async function requireSignIn(req, res, next) {
  req.user = await findLoggedInUser(req);
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

// For the admin's own tools, like choosing moderators. Use after requireSignIn.
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only the admin can do that.' });
  }
  next();
}
