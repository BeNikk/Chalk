// The last stop for any error a route throws. Express 5 sends async errors here automatically.
// It always answers in JSON and never shows the real error to the user.

export function errorHandler(error, req, res, _next) {
  // Prisma's code for "that value must be unique", e.g. two sign-ups racing for one handle.
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'That is already taken.' });
  }

  // Prisma's codes for "that row is gone", e.g. a post deleted while someone was liking it.
  if (error.code === 'P2025' || error.code === 'P2003') {
    return res.status(404).json({ error: 'That no longer exists.' });
  }

  // The browser sent something that isn't valid JSON.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request was not valid JSON.' });
  }

  // Other problems with the request itself (like a body that's too large) keep their 4xx status.
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: 'There was a problem with that request.' });
  }

  console.error(error);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
