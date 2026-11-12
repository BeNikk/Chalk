import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  app,
  createUser,
  logIn,
  prisma,
  request,
  resetDatabase,
  sentEmails,
  tokenFromLastEmail,
} from './helpers.js';

beforeEach(resetDatabase);

const newAccount = { email: 'Inky@Example.com', password: 'password123', handle: 'InkyFox' };

test('sign up creates an unverified account and emails a link', async () => {
  const res = await request(app).post('/api/auth/signup').send(newAccount).expect(201);
  assert.match(res.body.message, /check your email/i);

  const user = await prisma.user.findUnique({ where: { email: 'inky@example.com' } });
  assert.equal(user.handle, 'inkyfox'); // saved in lowercase
  assert.equal(user.emailVerifiedAt, null);
  assert.notEqual(user.passwordHash, 'password123'); // only the hash is stored
  assert.equal(sentEmails.length, 1);
});

test('sign up rejects bad input with a helpful message', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'not-an-email', password: 'short', handle: 'a b' })
    .expect(400);
  assert.ok(res.body.error);
  assert.ok(res.body.fields.email);
  assert.ok(res.body.fields.password);
  assert.ok(res.body.fields.handle);
});

test('sign up rejects an email or handle that is already used', async () => {
  await createUser({ handle: 'inkyfox' });

  await request(app)
    .post('/api/auth/signup')
    .send({ ...newAccount, email: 'inkyfox@test.chalk', handle: 'someone_else' })
    .expect(409);
  await request(app)
    .post('/api/auth/signup')
    .send({ ...newAccount, email: 'new@example.com' })
    .expect(409);
});

test('you can only log in after verifying your email', async () => {
  await request(app).post('/api/auth/signup').send(newAccount).expect(201);

  const blocked = await request(app)
    .post('/api/auth/login')
    .send({ email: newAccount.email, password: newAccount.password })
    .expect(403);
  assert.equal(blocked.body.code, 'EMAIL_NOT_VERIFIED');

  await request(app).post('/api/auth/verify').send({ token: tokenFromLastEmail() }).expect(200);
  await request(app)
    .post('/api/auth/login')
    .send({ email: newAccount.email, password: newAccount.password })
    .expect(200);
});

test('a verify link works only once', async () => {
  await request(app).post('/api/auth/signup').send(newAccount).expect(201);
  const token = tokenFromLastEmail();

  await request(app).post('/api/auth/verify').send({ token }).expect(200);
  await request(app).post('/api/auth/verify').send({ token }).expect(400);
});

test('verifying with ADMIN_EMAIL makes you the admin', async () => {
  await request(app)
    .post('/api/auth/signup')
    .send({ ...newAccount, email: 'admin@test.chalk', handle: 'boss' })
    .expect(201);
  await request(app).post('/api/auth/verify').send({ token: tokenFromLastEmail() }).expect(200);

  const admin = await prisma.user.findUnique({ where: { handle: 'boss' } });
  assert.equal(admin.role, 'ADMIN');
});

test('wrong password is refused', async () => {
  const user = await createUser();
  await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'wrong-password' })
    .expect(401);
});

test('logged-in users can see their account, and logging out ends it', async () => {
  const user = await createUser();
  const browser = await logIn(user);

  const me = await browser.get('/api/me').expect(200);
  assert.equal(me.body.user.handle, 'tester');
  assert.equal(me.body.user.passwordHash, undefined); // never sent to the browser

  await browser.post('/api/auth/logout').expect(200);
  await browser.get('/api/me').expect(401);
});

test('/api/me needs you to be logged in', async () => {
  await request(app).get('/api/me').expect(401);
});

test('forgot password gives the same answer for unknown emails', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody@example.com' })
    .expect(200);
  assert.match(res.body.message, /if that email has an account/i);
  assert.equal(sentEmails.length, 0);
});

test('a reset link changes the password', async () => {
  const user = await createUser();
  await request(app).post('/api/auth/forgot-password').send({ email: user.email }).expect(200);

  await request(app)
    .post('/api/auth/reset-password')
    .send({ token: tokenFromLastEmail(), password: 'brand-new-password' })
    .expect(200);

  await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'brand-new-password' })
    .expect(200);
});

test('signing up again before verifying replaces the old details', async () => {
  // Someone else signs up with your email first...
  await request(app)
    .post('/api/auth/signup')
    .send({ ...newAccount, password: 'attacker-password', handle: 'sneaky' })
    .expect(201);

  // ...then you sign up with it, verify, and the account is yours.
  await request(app).post('/api/auth/signup').send(newAccount).expect(201);
  await request(app).post('/api/auth/verify').send({ token: tokenFromLastEmail() }).expect(200);

  await request(app)
    .post('/api/auth/login')
    .send({ email: newAccount.email, password: 'attacker-password' })
    .expect(401);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: newAccount.email, password: newAccount.password })
    .expect(200);
  assert.equal(login.body.user.handle, 'inkyfox');
});

test('a new verify email makes the older link stop working', async () => {
  await request(app).post('/api/auth/signup').send(newAccount).expect(201);
  const oldToken = tokenFromLastEmail();

  await request(app).post('/api/auth/resend-verification').send({ email: newAccount.email }).expect(200);
  await request(app).post('/api/auth/verify').send({ token: oldToken }).expect(400);
  await request(app).post('/api/auth/verify').send({ token: tokenFromLastEmail() }).expect(200);
});

test('resend verification gives the same answer for unknown emails', async () => {
  const res = await request(app)
    .post('/api/auth/resend-verification')
    .send({ email: 'nobody@example.com' })
    .expect(200);
  assert.match(res.body.message, /if that account needs verifying/i);
  assert.equal(sentEmails.length, 0);
});

test('a reset link works only once', async () => {
  const user = await createUser();
  await request(app).post('/api/auth/forgot-password').send({ email: user.email }).expect(200);
  const token = tokenFromLastEmail();

  await request(app).post('/api/auth/reset-password').send({ token, password: 'new-password-1' }).expect(200);
  await request(app).post('/api/auth/reset-password').send({ token, password: 'new-password-2' }).expect(400);
});
