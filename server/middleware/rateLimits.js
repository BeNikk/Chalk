// Slows down anyone trying to guess passwords or spam emails:
// at most 20 tries per 15 minutes from the same address.
// The counts live in memory, so on Vercel each server copy counts separately. Good enough for now.

import { rateLimit } from 'express-rate-limit';
import config from '../config.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 20, // tests make many requests quickly
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many tries. Please wait a few minutes and try again.' },
});

// Posting and commenting: at most 30 per 15 minutes, which is plenty for a person and stops spam.
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You are posting very fast. Please wait a few minutes.' },
});

// Liking and following: looser, because people tap these a lot.
export const likeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Slow down a little! Try again in a few minutes.' },
});
