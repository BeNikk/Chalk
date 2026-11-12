import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app, request } from './helpers.js';

test('the health check says the server is alive', async () => {
  const res = await request(app).get('/api/health').expect(200);
  assert.deepEqual(res.body, { ok: true });
});

test('the website pages are served', async () => {
  await request(app).get('/').expect(200);
  await request(app).get('/feed.html').expect(200);
  await request(app).get('/rules.html').expect(200);
});

test('unknown pages get the friendly 404 page, even deep addresses', async () => {
  const res = await request(app).get('/no-such-page').expect(404);
  assert.match(res.text, /Page not found/);

  // From /a/b/c a relative "css/base.css" would point at /a/b/css/…, so the 404 page uses /css/….
  const deep = await request(app).get('/a/b/c').expect(404);
  assert.match(deep.text, /href="\/css\/base\.css"/);
});

test('unknown API addresses answer in JSON', async () => {
  const res = await request(app).get('/api/no-such-thing').expect(404);
  assert.equal(res.body.error, 'Not found');
});
