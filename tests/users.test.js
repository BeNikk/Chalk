import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { app, createUser, logIn, prisma, request, resetDatabase } from './helpers.js';
import { UPLOADS_FOLDER } from '../server/services/photos.js';

beforeEach(resetDatabase);

// The smallest possible PNG image (1×1 pixel), for upload tests.
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

test('anyone can see a profile, but never the email', async () => {
  await createUser({ handle: 'inkyfox' });

  const res = await request(app).get('/api/users/InkyFox').expect(200); // handles ignore capitals
  assert.equal(res.body.user.handle, 'inkyfox');
  assert.equal(res.body.user.email, undefined);
  await request(app).get('/api/users/nobody').expect(404);
});

test('a profile lists that user’s posts', async () => {
  const fox = await createUser({ handle: 'inkyfox' });
  const other = await createUser({ handle: 'other' });
  await prisma.post.create({ data: { authorId: fox.id, label: 'POETRY', body: 'mine' } });
  await prisma.post.create({ data: { authorId: other.id, label: 'RANT', body: 'not mine' } });

  const res = await request(app).get('/api/users/inkyfox/posts').expect(200);
  assert.deepEqual(res.body.posts.map((post) => post.body), ['mine']);
});

test('you can change your bio and theme', async () => {
  const browser = await logIn(await createUser());

  const res = await browser
    .patch('/api/me')
    .send({ bio: '  Writes at 2am.  ', theme: 'chalkboard' })
    .expect(200);
  assert.equal(res.body.user.bio, 'Writes at 2am.');
  assert.equal(res.body.user.theme, 'chalkboard');

  await browser.patch('/api/me').send({ theme: 'not-a-theme' }).expect(400);
  await browser.patch('/api/me').send({ bio: 'x'.repeat(161) }).expect(400);
  await request(app).patch('/api/me').send({ bio: 'hi' }).expect(401);
});

test('you can upload and remove a profile photo', async () => {
  const browser = await logIn(await createUser());

  const uploaded = await browser
    .put('/api/me/avatar')
    .attach('photo', tinyPng, { filename: 'me.png', contentType: 'image/png' })
    .expect(200);
  const { avatarUrl } = uploaded.body.user;
  assert.match(avatarUrl, /^\/uploads\/avatars\/.+\.png$/);
  const savedFile = path.join(UPLOADS_FOLDER, 'avatars', path.basename(avatarUrl));
  assert.equal(existsSync(savedFile), true);

  const removed = await browser.delete('/api/me/avatar').expect(200);
  assert.equal(removed.body.user.avatarUrl, null);
  assert.equal(existsSync(savedFile), false); // the file is deleted too
});

test('a new photo replaces the old one, and the old file is deleted', async () => {
  const browser = await logIn(await createUser());
  const upload = () =>
    browser.put('/api/me/avatar').attach('photo', tinyPng, { filename: 'me.png', contentType: 'image/png' });

  const first = (await upload().expect(200)).body.user.avatarUrl;
  const second = (await upload().expect(200)).body.user.avatarUrl;
  assert.notEqual(first, second);

  const fileOf = (url) => path.join(UPLOADS_FOLDER, 'avatars', path.basename(url));
  assert.equal(existsSync(fileOf(first)), false);
  assert.equal(existsSync(fileOf(second)), true);
  await browser.delete('/api/me/avatar').expect(200); // tidy up
});

test('a file pretending to be a photo is refused', async () => {
  const browser = await logIn(await createUser());
  await browser
    .put('/api/me/avatar')
    .attach('photo', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.png', contentType: 'image/png' })
    .expect(400);
});

test('photos must be images, and not too big', async () => {
  const browser = await logIn(await createUser());

  await browser
    .put('/api/me/avatar')
    .attach('photo', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' })
    .expect(400);
  await browser
    .put('/api/me/avatar')
    .attach('photo', Buffer.alloc(3 * 1024 * 1024), { filename: 'big.png', contentType: 'image/png' })
    .expect(400);
  await browser.put('/api/me/avatar').expect(400); // no photo at all
});

test('the admin can add and remove moderators', async () => {
  const admin = await logIn(await createUser({ handle: 'boss', role: 'ADMIN' }));
  await createUser({ handle: 'helper' });

  await admin.put('/api/admin/moderators/helper').expect(200);
  const list = await admin.get('/api/admin/moderators').expect(200);
  assert.deepEqual(list.body.moderators.map((mod) => mod.handle), ['helper']);

  await admin.delete('/api/admin/moderators/helper').expect(200);
  const helper = await prisma.user.findUnique({ where: { handle: 'helper' } });
  assert.equal(helper.role, 'USER');
});

test('only the admin can choose moderators', async () => {
  await createUser({ handle: 'helper' });
  const moderator = await logIn(await createUser({ handle: 'mod', role: 'MODERATOR' }));

  await moderator.put('/api/admin/moderators/helper').expect(403);
  const student = await logIn(await createUser({ handle: 'student' }));
  await student.put('/api/admin/moderators/helper').expect(403);
  await moderator.get('/api/admin/moderators').expect(403);
  await request(app).get('/api/admin/moderators').expect(401);
});

test('the admin can’t be turned into a moderator, and unknown handles give 404', async () => {
  const admin = await logIn(await createUser({ handle: 'boss', role: 'ADMIN' }));

  await admin.put('/api/admin/moderators/boss').expect(400);
  await admin.put('/api/admin/moderators/nobody').expect(404);
  await admin.delete('/api/admin/moderators/nobody').expect(404);
});
