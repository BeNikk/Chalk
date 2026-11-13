import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app, createUser, logIn, prisma, request, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);

// Adds a post straight to the database, for tests that need one to exist already.
async function createPost(author, { label = 'RANT', body = 'Hello Chalk' } = {}) {
  return prisma.post.create({ data: { authorId: author.id, label, body } });
}

test('anyone can read the feed, newest first', async () => {
  const author = await createUser();
  await createPost(author, { body: 'first' });
  await createPost(author, { body: 'second' });

  const res = await request(app).get('/api/posts').expect(200);
  assert.deepEqual(res.body.posts.map((post) => post.body), ['second', 'first']);
  assert.equal(res.body.posts[0].author.handle, 'tester');
  assert.equal(res.body.posts[0].label, 'rant');
});

test('the feed can be filtered by label', async () => {
  const author = await createUser();
  await createPost(author, { label: 'POETRY', body: 'a poem' });
  await createPost(author, { label: 'RANT', body: 'a rant' });

  const res = await request(app).get('/api/posts?label=poetry').expect(200);
  assert.deepEqual(res.body.posts.map((post) => post.body), ['a poem']);
});

test('"before" loads the next page of older posts', async () => {
  const author = await createUser();
  const older = await createPost(author, { body: 'older' });
  const newer = await createPost(author, { body: 'newer' });

  const res = await request(app).get(`/api/posts?before=${newer.id}`).expect(200);
  assert.deepEqual(res.body.posts.map((post) => post.id), [older.id]);
});

test('logged-in users can write a post', async () => {
  const browser = await logIn(await createUser());

  const res = await browser
    .post('/api/posts')
    .send({ label: 'fixit', title: '  ', body: '  The tap is broken.  ' })
    .expect(201);
  assert.equal(res.body.post.body, 'The tap is broken.');
  assert.equal(res.body.post.title, null); // an empty title becomes no title
  assert.equal(res.body.post.label, 'fixit');
});

test('writing a post needs an account and valid input', async () => {
  await request(app).post('/api/posts').send({ label: 'rant', body: 'hi' }).expect(401);

  const browser = await logIn(await createUser());
  await browser.post('/api/posts').send({ label: 'not-a-label', body: 'hi' }).expect(400);
  await browser.post('/api/posts').send({ label: 'rant', body: '   ' }).expect(400);
});

test('anyone can open a single post, and missing posts give 404', async () => {
  const post = await createPost(await createUser());
  await request(app).get(`/api/posts/${post.id}`).expect(200);
  await request(app).get('/api/posts/999999').expect(404);
  await request(app).get('/api/posts/not-a-number').expect(404);
});

test('you can delete your own post, but not someone else’s', async () => {
  const author = await createUser({ handle: 'author' });
  const other = await createUser({ handle: 'other' });
  const post = await createPost(author);

  await (await logIn(other)).delete(`/api/posts/${post.id}`).expect(403);
  await (await logIn(author)).delete(`/api/posts/${post.id}`).expect(200);
  await request(app).get(`/api/posts/${post.id}`).expect(404);
});

test('moderators can delete any post', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const moderator = await createUser({ handle: 'mod', role: 'MODERATOR' });

  await (await logIn(moderator)).delete(`/api/posts/${post.id}`).expect(200);
});

test('liking a post counts once per person, and can be undone', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const browser = await logIn(await createUser({ handle: 'fan' }));

  await browser.put(`/api/posts/${post.id}/like`).expect(200);
  const twice = await browser.put(`/api/posts/${post.id}/like`).expect(200);
  assert.equal(twice.body.likeCount, 1);
  assert.equal(twice.body.likedByMe, true);

  const feed = await browser.get('/api/posts').expect(200);
  assert.equal(feed.body.posts[0].likedByMe, true);

  const undone = await browser.delete(`/api/posts/${post.id}/like`).expect(200);
  assert.equal(undone.body.likeCount, 0);
});

test('liking needs an account and a real post', async () => {
  const post = await createPost(await createUser());
  await request(app).put(`/api/posts/${post.id}/like`).expect(401);

  const browser = await logIn(await createUser({ handle: 'fan' }));
  await browser.put('/api/posts/999999/like').expect(404);
});

test('anyone can see who liked a post, newest like first', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const first = await createUser({ handle: 'first_fan' });
  const second = await createUser({ handle: 'second_fan' });
  await (await logIn(first)).put(`/api/posts/${post.id}/like`).expect(200);
  await (await logIn(second)).put(`/api/posts/${post.id}/like`).expect(200);

  const res = await request(app).get(`/api/posts/${post.id}/likes`).expect(200);
  assert.deepEqual(res.body.people, [
    { handle: 'second_fan', avatarUrl: null },
    { handle: 'first_fan', avatarUrl: null },
  ]);

  await request(app).get('/api/posts/999999/likes').expect(404);
});

test('the feed loads 20 posts at a time', async () => {
  const author = await createUser();
  for (let i = 0; i < 21; i++) {
    await createPost(author, { body: `post ${i}` });
  }

  const firstPage = await request(app).get('/api/posts').expect(200);
  assert.equal(firstPage.body.posts.length, 20);

  const lastId = firstPage.body.posts.at(-1).id;
  const secondPage = await request(app).get(`/api/posts?before=${lastId}`).expect(200);
  assert.deepEqual(secondPage.body.posts.map((post) => post.body), ['post 0']);
});

test('an unknown label is refused', async () => {
  await request(app).get('/api/posts?label=nonsense').expect(400);
});

test('ids that are not real post ids give 404, not a server error', async () => {
  await request(app).get('/api/posts/99999999999').expect(404);
  await request(app).get('/api/posts/1e0').expect(404);
});

test('posts never show the author’s email or password', async () => {
  await createPost(await createUser());
  const res = await request(app).get('/api/posts').expect(200);
  const text = JSON.stringify(res.body);
  assert.equal(text.includes('@test.chalk'), false);
  assert.equal(text.includes('passwordHash'), false);
});

test('very long posts and titles are refused', async () => {
  const browser = await logIn(await createUser());
  await browser.post('/api/posts').send({ label: 'mess', body: 'x'.repeat(5001) }).expect(400);
  await browser.post('/api/posts').send({ label: 'mess', title: 'x'.repeat(121), body: 'hi' }).expect(400);
});

test('deleting needs an account, and a post that exists', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  await request(app).delete(`/api/posts/${post.id}`).expect(401);

  const admin = await createUser({ handle: 'boss', role: 'ADMIN' });
  const browser = await logIn(admin);
  await browser.delete('/api/posts/999999').expect(404);
  await browser.delete(`/api/posts/${post.id}`).expect(200); // the admin can delete any post
});

test('likedByMe is only true for the person who liked it', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const fan = await logIn(await createUser({ handle: 'fan' }));
  await fan.put(`/api/posts/${post.id}/like`).expect(200);

  const someoneElse = await logIn(await createUser({ handle: 'someone' }));
  const theirFeed = await someoneElse.get('/api/posts').expect(200);
  assert.equal(theirFeed.body.posts[0].likedByMe, false);
  assert.equal(theirFeed.body.posts[0].likeCount, 1);

  const loggedOut = await request(app).get('/api/posts').expect(200);
  assert.equal(loggedOut.body.posts[0].likedByMe, false);
});

test('liking the same post several times at once still counts once', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const browser = await logIn(await createUser({ handle: 'fan' }));

  const results = await Promise.all([1, 2, 3].map(() => browser.put(`/api/posts/${post.id}/like`)));
  assert.deepEqual(results.map((res) => res.status), [200, 200, 200]);
  assert.equal(await prisma.like.count({ where: { postId: post.id } }), 1);
});

// ---------- Edit post ----------

test('authors can edit their own post while preserving likes, comments, and glances', async () => {
  const author = await createUser({ handle: 'author' });
  const fan = await createUser({ handle: 'fan' });
  const authorBrowser = await logIn(author);
  const fanBrowser = await logIn(fan);

  const created = await authorBrowser
    .post('/api/posts')
    .send({ label: 'rant', title: 'Old title', body: 'Original body' })
    .expect(201);
  const postId = created.body.post.id;

  await fanBrowser.put(`/api/posts/${postId}/like`).expect(200);
  await fanBrowser.post(`/api/posts/${postId}/comments`).send({ body: 'Nice!' }).expect(201);
  await fanBrowser.post(`/api/posts/${postId}/glance`).send({ readDurationMs: 3500 }).expect(200);

  const edited = await authorBrowser
    .patch(`/api/posts/${postId}`)
    .send({ label: 'poetry', title: '   ', body: '  Updated verse  ' })
    .expect(200);

  assert.equal(edited.body.post.id, postId);
  assert.equal(edited.body.post.label, 'poetry');
  assert.equal(edited.body.post.title, null);
  assert.equal(edited.body.post.body, 'Updated verse');
  assert.ok(edited.body.post.editedAt);
  assert.equal(edited.body.post.likeCount, 1);
  assert.equal(edited.body.post.commentCount, 1);
  assert.equal(edited.body.post.glanceCount, 1);
  assert.equal(edited.body.post.totalGlances, 1);
  assert.equal(await prisma.post.count(), 1);
});

test('partial edits keep omitted fields unchanged', async () => {
  const author = await createUser({ handle: 'author' });
  const browser = await logIn(author);
  const post = await prisma.post.create({
    data: { authorId: author.id, label: 'MUSIC', title: 'Track', body: 'First version' },
  });

  const edited = await browser.patch(`/api/posts/${post.id}`).send({ body: 'Second version' }).expect(200);
  assert.equal(edited.body.post.label, 'music');
  assert.equal(edited.body.post.title, 'Track');
  assert.equal(edited.body.post.body, 'Second version');
});

test('only the original author can edit a post (not others, moderators, or admins)', async () => {
  const author = await createUser({ handle: 'author' });
  const post = await createPost(author);
  const other = await logIn(await createUser({ handle: 'other' }));
  const mod = await logIn(await createUser({ handle: 'mod', role: 'MODERATOR' }));
  const admin = await logIn(await createUser({ handle: 'boss', role: 'ADMIN' }));

  await request(app).patch(`/api/posts/${post.id}`).send({ body: 'hack' }).expect(401);
  await other.patch(`/api/posts/${post.id}`).send({ body: 'hack' }).expect(403);
  await mod.patch(`/api/posts/${post.id}`).send({ body: 'hack' }).expect(403);
  await admin.patch(`/api/posts/${post.id}`).send({ body: 'hack' }).expect(403);
});

test('editing rejects invalid input and missing posts', async () => {
  const author = await createUser({ handle: 'author' });
  const browser = await logIn(author);
  const post = await createPost(author);

  await browser.patch('/api/posts/999999').send({ body: 'hi' }).expect(404);
  await browser.patch('/api/posts/not-a-number').send({ body: 'hi' }).expect(404);
  await browser.patch(`/api/posts/${post.id}`).send({}).expect(400);
  await browser.patch(`/api/posts/${post.id}`).send({ body: '   ' }).expect(400);
  await browser.patch(`/api/posts/${post.id}`).send({ label: 'invalid' }).expect(400);
  await browser.patch(`/api/posts/${post.id}`).send({ title: 'x'.repeat(121) }).expect(400);
});

// ---------- Glances (reading analytics) ----------

test('glances require a real post and a minimum reading duration', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));

  await request(app).post('/api/posts/999999/glance').send({ readDurationMs: 4000 }).expect(404);
  await request(app).post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 500 }).expect(400);
  await request(app).post(`/api/posts/${post.id}/glance`).send({}).expect(400);
});

test('author views are not counted as glances', async () => {
  const author = await createUser({ handle: 'author' });
  const post = await createPost(author);
  const browser = await logIn(author);

  const res = await browser.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 5000 }).expect(200);
  assert.equal(res.body.counted, false);
  assert.equal(res.body.reason, 'author');
  assert.equal(res.body.glanceCount, 0);
  assert.equal(res.body.totalGlances, 0);
});

test('glances count unique readers and prevent duplicate rapid counting', async () => {
  const author = await createUser({ handle: 'author' });
  const post = await createPost(author);

  // Loading the feed or opening the post without meeting the read threshold does not count a glance.
  await request(app).get('/api/posts').expect(200);
  const initial = await request(app).get(`/api/posts/${post.id}`).expect(200);
  assert.equal(initial.body.post.glanceCount, 0);
  assert.equal(initial.body.post.totalGlances, 0);

  const reader1 = await logIn(await createUser({ handle: 'reader1' }));
  const reader2 = await logIn(await createUser({ handle: 'reader2' }));

  // Concurrent requests from the same reader only count once.
  await Promise.all([1, 2, 3].map(() => reader1.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 4000 })));
  const again = await reader1.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 4000 }).expect(200);
  assert.equal(again.body.counted, false);
  assert.equal(again.body.glanceCount, 1);
  assert.equal(again.body.totalGlances, 1);

  // A second distinct reader increments both counts.
  const second = await reader2.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 4000 }).expect(200);
  assert.equal(second.body.counted, true);
  assert.equal(second.body.glanceCount, 2);
  assert.equal(second.body.totalGlances, 2);

  // An anonymous browser session is deduplicated via its visitor cookie.
  const anon = request.agent(app);
  await anon.get(`/api/posts/${post.id}`).expect(200);
  const anonFirst = await anon.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 4000 }).expect(200);
  assert.equal(anonFirst.body.glanceCount, 3);
  assert.equal(anonFirst.body.totalGlances, 3);
  const anonRepeat = await anon.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 4000 }).expect(200);
  assert.equal(anonRepeat.body.counted, false);
  assert.equal(anonRepeat.body.glanceCount, 3);
  assert.equal(anonRepeat.body.totalGlances, 3);
});

test('re-reading after the cooldown increments total reads without inflating unique readers', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const reader = await createUser({ handle: 'reader' });
  const browser = await logIn(reader);

  await browser.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 3500 }).expect(200);

  // Simulate a later reading session past the 15-minute cooldown.
  await prisma.glance.update({
    where: { postId_readerKey: { postId: post.id, readerKey: `u:${reader.id}` } },
    data: { lastReadAt: new Date(Date.now() - 20 * 60 * 1000) },
  });

  const reread = await browser.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 3500 }).expect(200);
  assert.equal(reread.body.counted, true);
  assert.equal(reread.body.glanceCount, 1);
  assert.equal(reread.body.totalGlances, 2);

  const feed = await request(app).get('/api/posts').expect(200);
  assert.equal(feed.body.posts[0].glanceCount, 1);
  assert.equal(feed.body.posts[0].totalGlances, 2);
});

test('deleting a post deletes its glances', async () => {
  const author = await createUser({ handle: 'author' });
  const post = await createPost(author);
  const reader = await logIn(await createUser({ handle: 'reader' }));
  await reader.post(`/api/posts/${post.id}/glance`).send({ readDurationMs: 3500 }).expect(200);
  assert.equal(await prisma.glance.count(), 1);

  await (await logIn(author)).delete(`/api/posts/${post.id}`).expect(200);
  assert.equal(await prisma.glance.count(), 0);
});
