import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app, createUser, logIn, prisma, request, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);

async function createPost(author) {
  return prisma.post.create({ data: { authorId: author.id, label: 'RANT', body: 'A post' } });
}

test('logged-in users can comment, and anyone can read the comments', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const browser = await logIn(await createUser({ handle: 'reader' }));

  const res = await browser
    .post(`/api/posts/${post.id}/comments`)
    .send({ body: '  So true.  ' })
    .expect(201);
  assert.equal(res.body.comment.body, 'So true.');
  assert.equal(res.body.comment.author.handle, 'reader');

  const list = await request(app).get(`/api/posts/${post.id}/comments`).expect(200);
  assert.deepEqual(list.body.comments.map((comment) => comment.body), ['So true.']);
});

test('comments are listed oldest first', async () => {
  const post = await createPost(await createUser());
  const browser = await logIn(await createUser({ handle: 'reader' }));
  await browser.post(`/api/posts/${post.id}/comments`).send({ body: 'first' }).expect(201);
  await browser.post(`/api/posts/${post.id}/comments`).send({ body: 'second' }).expect(201);

  const list = await request(app).get(`/api/posts/${post.id}/comments`).expect(200);
  assert.deepEqual(list.body.comments.map((comment) => comment.body), ['first', 'second']);
});

test('the feed counts comments', async () => {
  const post = await createPost(await createUser());
  const browser = await logIn(await createUser({ handle: 'reader' }));
  await browser.post(`/api/posts/${post.id}/comments`).send({ body: 'hi' }).expect(201);

  const feed = await request(app).get('/api/posts').expect(200);
  assert.equal(feed.body.posts[0].commentCount, 1);
});

test('commenting needs an account, a real post and some text', async () => {
  const post = await createPost(await createUser());
  await request(app).post(`/api/posts/${post.id}/comments`).send({ body: 'hi' }).expect(401);

  const browser = await logIn(await createUser({ handle: 'reader' }));
  await browser.post('/api/posts/999999/comments').send({ body: 'hi' }).expect(404);
  await browser.post(`/api/posts/${post.id}/comments`).send({ body: '   ' }).expect(400);
  await browser.post(`/api/posts/${post.id}/comments`).send({ body: 'x'.repeat(1001) }).expect(400);
  await request(app).get('/api/posts/999999/comments').expect(404);
});

test('you can delete your own comment, but not someone else’s', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const writer = await createUser({ handle: 'writer' });
  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: writer.id, body: 'mine' },
  });

  await request(app).delete(`/api/comments/${comment.id}`).expect(401);

  const other = await logIn(await createUser({ handle: 'other' }));
  await other.delete(`/api/comments/${comment.id}`).expect(403);

  const writerBrowser = await logIn(writer);
  await writerBrowser.delete(`/api/comments/${comment.id}`).expect(200);
  await writerBrowser.delete(`/api/comments/${comment.id}`).expect(404); // already gone
  await writerBrowser.delete('/api/comments/abc').expect(404);
});

test('moderators can delete any comment', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: post.authorId, body: 'hmm' },
  });

  const moderator = await logIn(await createUser({ handle: 'mod', role: 'MODERATOR' }));
  await moderator.delete(`/api/comments/${comment.id}`).expect(200);
});

test('the admin can delete any comment', async () => {
  const post = await createPost(await createUser({ handle: 'author' }));
  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: post.authorId, body: 'hmm' },
  });

  const admin = await logIn(await createUser({ handle: 'boss', role: 'ADMIN' }));
  await admin.delete(`/api/comments/${comment.id}`).expect(200);
});

test('comments never show the author’s email or password', async () => {
  const post = await createPost(await createUser());
  const reader = await logIn(await createUser({ handle: 'reader' }));
  await reader.post(`/api/posts/${post.id}/comments`).send({ body: 'hi' }).expect(201);

  const list = await request(app).get(`/api/posts/${post.id}/comments`).expect(200);
  const text = JSON.stringify(list.body);
  assert.equal(text.includes('@test.chalk'), false);
  assert.equal(text.includes('passwordHash'), false);
});

test('deleting a post deletes its comments', async () => {
  const author = await createUser({ handle: 'author' });
  const post = await createPost(author);
  await prisma.comment.create({ data: { postId: post.id, authorId: author.id, body: 'bye' } });

  const authorBrowser = await logIn(author);
  await authorBrowser.delete(`/api/posts/${post.id}`).expect(200);
  assert.equal(await prisma.comment.count(), 0);
});
