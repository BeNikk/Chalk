// Checks every entry in the contributors list, so a typo in someone's first pull request shows up in CI, not on the live site.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { app, request } from './helpers.js';
import { PEEPS, contributors } from '../public/js/contributors-list.js';

const FIELDS = ['name', 'url', 'photo', 'peep'];

test('the contributors page is served', async () => {
  await request(app).get('/contributors.html').expect(200);
});

test('every peep you can pick has a drawing', () => {
  for (const peep of PEEPS) {
    assert.ok(existsSync(`public/illustrations/${peep}.svg`), `public/illustrations/${peep}.svg is missing`);
  }
});

test('every contributor entry is filled in correctly', () => {
  for (const person of contributors) {
    const who = person.name ?? JSON.stringify(person);

    for (const field of Object.keys(person)) {
      assert.ok(FIELDS.includes(field), `${who}: "${field}" isn't a field. Use one of: ${FIELDS.join(', ')}`);
    }
    assert.ok(typeof person.name === 'string' && person.name.trim(), `${JSON.stringify(person)} needs a name`);

    for (const field of ['url', 'photo']) {
      if (person[field] === undefined) continue;
      assert.match(person[field], /^https:\/\/\S+$/, `${who}: ${field} must start with https://`);
    }

    if (person.peep !== undefined) {
      assert.ok(PEEPS.includes(person.peep), `${who}: peep must be one of: ${PEEPS.join(', ')}`);
    }
  }
});

test('nobody is on the contributors list twice', () => {
  const names = contributors.map((person) => person.name.trim().toLowerCase());
  const repeated = names.filter((name, index) => names.indexOf(name) !== index);
  assert.deepEqual(repeated, [], `on the list twice: ${repeated.join(', ')}`);
});
