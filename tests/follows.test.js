import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { app, createUser, logIn, prisma, request, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);

test('following someone counts once, shows on their profile, and can be undone', async () => {
  await createUser({ handle: 'inkyfox' });
  const fan = await logIn(await createUser({ handle: 'fan' }));

  await fan.put('/api/users/inkyfox/follow').expect(200);
  const twice = await fan.put('/api/users/InkyFox/follow').expect(200);
  assert.deepEqual(twice.body, { followerCount: 1, followedByMe: true });

  const profile = await fan.get('/api/users/inkyfox').expect(200);
  assert.equal(profile.body.user.followerCount, 1);
  assert.equal(profile.body.user.followingCount, 0);
  assert.equal(profile.body.user.followedByMe, true);

  const fanProfile = await request(app).get('/api/users/fan').expect(200);
  assert.equal(fanProfile.body.user.followingCount, 1);
  assert.equal(fanProfile.body.user.followedByMe, false); // logged out

  const undone = await fan.delete('/api/users/inkyfox/follow').expect(200);
  assert.deepEqual(undone.body, { followerCount: 0, followedByMe: false });
});

test('following needs an account, a real person, and someone other than you', async () => {
  await createUser({ handle: 'inkyfox' });
  await request(app).put('/api/users/inkyfox/follow').expect(401);

  const fan = await logIn(await createUser({ handle: 'fan' }));
  await fan.put('/api/users/nobody/follow').expect(404);
  await fan.put('/api/users/fan/follow').expect(400);
});

test('anyone can see followers and following, newest first, without emails', async () => {
  await createUser({ handle: 'inkyfox' });
  const first = await logIn(await createUser({ handle: 'first_fan' }));
  const second = await logIn(await createUser({ handle: 'second_fan' }));
  await first.put('/api/users/inkyfox/follow').expect(200);
  await second.put('/api/users/inkyfox/follow').expect(200);
  await second.put('/api/users/first_fan/follow').expect(200);

  const followers = await request(app).get('/api/users/inkyfox/followers').expect(200);
  assert.deepEqual(followers.body.people, [
    { handle: 'second_fan', avatarUrl: null },
    { handle: 'first_fan', avatarUrl: null },
  ]);

  const following = await request(app).get('/api/users/second_fan/following').expect(200);
  assert.deepEqual(following.body.people.map((person) => person.handle), ['first_fan', 'inkyfox']);

  await request(app).get('/api/users/nobody/followers').expect(404);
  await request(app).get('/api/users/nobody/following').expect(404);
});

test('the Following feed only has posts by people you follow', async () => {
  const fox = await createUser({ handle: 'inkyfox' });
  const other = await createUser({ handle: 'other' });
  await prisma.post.create({ data: { authorId: fox.id, label: 'RANT', body: 'followed' } });
  await prisma.post.create({ data: { authorId: other.id, label: 'RANT', body: 'not followed' } });

  const fan = await logIn(await createUser({ handle: 'fan' }));
  const empty = await fan.get('/api/posts?following=true').expect(200);
  assert.deepEqual(empty.body.posts, []);

  await fan.put('/api/users/inkyfox/follow').expect(200);
  const res = await fan.get('/api/posts?following=true').expect(200);
  assert.deepEqual(res.body.posts.map((post) => post.body), ['followed']);

  await request(app).get('/api/posts?following=true').expect(401);
});
