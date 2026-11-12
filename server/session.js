// Login sessions: how the server remembers who you are between requests.
// New to sessions and cookies? See docs/help/sessions.md

import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma from './db.js';
import config from './config.js';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export const sessionMiddleware = session({
  name: 'chalk.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false, // no cookie until someone actually logs in
  cookie: {
    httpOnly: true, // page JavaScript can't read it, so injected scripts can't steal it
    sameSite: 'lax', // other websites can't send requests with your cookie
    secure: config.isProduction, // HTTPS only on the live site
    maxAge: THIRTY_DAYS,
  },
  // Expired sessions are ignored when read, so no cleanup timer is needed (timers don't suit Vercel).
  store: new PrismaSessionStore(prisma, { dbRecordIdIsSessionId: true }),
});

// express-session uses callbacks; these wrap them in Promises so controllers can `await` them.

export function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    // A brand-new session id on every login, so an old id can't be reused by someone else.
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = userId;
      req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

export function endSession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}
