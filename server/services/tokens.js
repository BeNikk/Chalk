// The secret codes inside "verify your email" and "reset your password" links.
// New to these? See docs/help/email-links.md

import crypto from 'node:crypto';
import { saveEmailToken } from '../models/tokens.js';

// Only a hash is saved, so someone who reads the database still can't use the links.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Makes a new random token, saves its hash, and returns the real token to put in the email.
export async function createEmailToken(userId, purpose, lifetimeInMs) {
  const token = crypto.randomBytes(32).toString('hex');
  await saveEmailToken({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + lifetimeInMs),
  });
  return token;
}
