# Tests

## Why tests

A test is a small program that uses the app and checks it behaves. Instead of clicking through sign-up by hand after every change, you run `npm test` and in a few seconds you know whether sign-up, login and the rest still work. CI runs them on every pull request too (see [ci.md](ci.md)).

## Running them

```bash
npm test
```

The tests use their **own database**, `chalk_test` (created by `npm run setup`), because they delete all data before each test. `scripts/test.js` loads the settings from `.env.test`, updates the test database's tables, and runs every file in `tests/` whose name ends in `.test.js`.

## Reading a test

```js
test('wrong password is refused', async () => {
  const user = await createUser();
  await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'wrong-password' })
    .expect(401);
});
```

- `test('…', async () => { … })`: the name says what should be true.
- `createUser()`: a helper from `tests/helpers.js` that adds a ready-to-use user.
- `request(app)`: [Supertest](https://github.com/forwardemail/supertest) sends a real request to the app, without starting a server.
- `.expect(401)`: fails the test unless the status code is 401.
- `assert.equal(a, b)`: fails unless `a` equals `b`.

`beforeEach(resetDatabase)` at the top of each file gives every test a clean, empty database.

## Logged-in tests

```js
const user = await createUser();
const browser = await logIn(user);
await browser.get('/api/me').expect(200);
```

`logIn` returns an **agent**: like a browser, it keeps the login cookie between requests.

## Writing your own

Copy a test close to what you need, change the name and the steps, and run `npm test`. A good test checks one thing, and its name reads like a sentence about the app.

## Learn more

- [Node.js test runner](https://nodejs.org/api/test.html)
- [Node.js assert](https://nodejs.org/api/assert.html)
- [Supertest](https://github.com/forwardemail/supertest)
