// What the sign-up, login and password forms must send. The `validate` middleware
// checks every request against these before it reaches a controller.
// New to Zod? See docs/help/validation.md

import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.');

// bcrypt only looks at the first 72 characters, so longer passwords aren't safer.
const password = z
  .string()
  .min(8, 'Passwords need at least 8 characters.')
  .max(72, 'Passwords can be at most 72 characters.');

const handle = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Handles are 3 to 20 letters, numbers or underscores.');

const token = z.string().min(1, 'This link is missing its code.');

export const signupSchema = z.object({ email, password, handle });
export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password.') });
export const emailSchema = z.object({ email });
export const verifySchema = z.object({ token });
export const resetPasswordSchema = z.object({ token, password });
