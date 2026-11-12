// Sign up, verify email, log in and out, and reset a forgotten password.
// Input has already been checked by the schemas in server/schemas/auth.js.

import config from '../config.js';
import {
  createUser,
  findUserByEmail,
  findUserByHandle,
  findUserById,
  markEmailVerified,
  toMyAccount,
  updatePassword,
  updateUnverifiedUser,
} from '../models/users.js';
import { deleteUnusedEmailTokens, useEmailToken } from '../models/tokens.js';
import { checkPassword, hashPassword } from '../services/passwords.js';
import { createEmailToken, hashToken } from '../services/tokens.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.js';
import { endSession, startSession } from '../session.js';

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

async function sendNewVerificationEmail(user) {
  await deleteUnusedEmailTokens(user.id, 'VERIFY');
  const token = await createEmailToken(user.id, 'VERIFY', ONE_DAY);
  await sendVerificationEmail(user.email, token);
}

export async function signup(req, res) {
  const { email, password, handle } = req.body;
  const existingUser = await findUserByEmail(email);

  if (existingUser?.emailVerifiedAt) {
    return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
  }

  const handleOwner = await findUserByHandle(handle);
  if (handleOwner && handleOwner.id !== existingUser?.id) {
    return res.status(409).json({ error: 'That handle is taken. Try another one.' });
  }

  const passwordHash = await hashPassword(password);
  // An unverified account doesn't belong to anyone yet: whoever can open the email gets it,
  // with the details they sign up with now. So nobody can claim someone else's email first.
  const user = existingUser
    ? await updateUnverifiedUser(existingUser.id, { handle, passwordHash })
    : await createUser({ email, handle, passwordHash });
  await sendNewVerificationEmail(user);

  res.status(201).json({ message: 'Account created! Check your email for a link to verify it.' });
}

export async function verifyEmail(req, res) {
  const token = await useEmailToken(hashToken(req.body.token), 'VERIFY');
  if (!token) {
    return res.status(400).json({ error: 'This link is invalid or has expired. Ask for a new one.' });
  }

  const user = await findUserById(token.userId);
  // Verifying proves you own ADMIN_EMAIL, so that's when you become admin.
  const role = config.adminEmail && user.email === config.adminEmail ? 'ADMIN' : user.role;
  await markEmailVerified(user.id, role);

  res.json({ message: 'Email verified! You can log in now.' });
}

export async function resendVerification(req, res) {
  const user = await findUserByEmail(req.body.email);
  if (user && !user.emailVerifiedAt) {
    await sendNewVerificationEmail(user);
  }
  // The same answer either way, so this can't be used to find out who has an account.
  res.json({ message: 'If that account needs verifying, we sent a new link.' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  const passwordIsRight = user && (await checkPassword(password, user.passwordHash));

  if (!passwordIsRight) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  if (!user.emailVerifiedAt) {
    return res.status(403).json({
      error: 'Please verify your email first. We can send you a new link.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  await startSession(req, user.id);
  res.json({ user: toMyAccount(user) });
}

export async function logout(req, res) {
  await endSession(req);
  res.clearCookie('chalk.sid');
  res.json({ message: 'Logged out.' });
}

export async function forgotPassword(req, res) {
  const user = await findUserByEmail(req.body.email);
  if (user) {
    const token = await createEmailToken(user.id, 'RESET', ONE_HOUR);
    await sendPasswordResetEmail(user.email, token);
  }
  // The same answer either way, so this can't be used to find out who has an account.
  res.json({ message: 'If that email has an account, we sent a link to reset the password.' });
}

export async function resetPassword(req, res) {
  const token = await useEmailToken(hashToken(req.body.token), 'RESET');
  if (!token) {
    return res.status(400).json({ error: 'This link is invalid or has expired. Ask for a new one.' });
  }

  await updatePassword(token.userId, await hashPassword(req.body.password));
  await deleteUnusedEmailTokens(token.userId, 'RESET');

  res.json({ message: 'Password changed! You can log in with your new password.' });
}
