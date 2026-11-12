// Shared tools for the tests: a clean database, ready-made users, and logged-in browsers.

import request from 'supertest';
import app from '../server/app.js';
import prisma from '../server/db.js';
import { hashPassword } from '../server/services/passwords.js';
import { sentEmails } from '../server/services/email.js';

// Tests wipe the database, so refuse to run against anything but the test database.
if (!process.env.DATABASE_URL.includes('chalk_test')) {
  throw new Error('Tests must use the chalk_test database. Run them with `npm test`.');
}

export const PASSWORD = 'password123';

export async function resetDatabase() {
  await prisma.user.deleteMany(); // also deletes their posts, comments, likes, follows and tokens
  await prisma.session.deleteMany();
  sentEmails.length = 0;
}

// Emails are `<handle>@test.chalk`, so avoid the handle "admin" (that's ADMIN_EMAIL in .env.test).
export async function createUser({ handle = 'tester', verified = true, role = 'USER' } = {}) {
  return prisma.user.create({
    data: {
      handle,
      role,
      email: `${handle}@test.chalk`,
      passwordHash: await hashPassword(PASSWORD),
      emailVerifiedAt: verified ? new Date() : null,
    },
  });
}

// An "agent" is like a browser: it keeps the login cookie between requests.
export async function logIn(user) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD }).expect(200);
  return agent;
}

// Reads the secret code out of the last email the app "sent".
export function tokenFromLastEmail() {
  const lastEmail = sentEmails.at(-1);
  return lastEmail.text.match(/token=([a-f0-9]+)/)[1];
}

export { app, prisma, request, sentEmails };
