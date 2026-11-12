# Checking input with Zod

## Never trust what the browser sends

The website's forms check things like "is this an email?", but anyone can send requests to the API directly, skipping the forms. So the **server** checks every request too.

## Schemas

Chalk describes what each request must look like with [Zod](https://zod.dev) schemas, in `server/schemas/`:

```js
const handle = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Handles are 3 to 20 letters, numbers or underscores.');

export const signupSchema = z.object({ email, password, handle });
```

Read it top to bottom: must be text, remove spaces at the ends, make it lowercase, then it must be 3 to 20 letters, numbers or underscores. The message is what the user sees if it fails.

## The `validate` middleware

Routes put `validate(someSchema)` before the controller (simplified):

```js
router.post('/signup', validate(signupSchema), signup);
```

`server/middleware/validate.js` checks `req.body`:

- **Bad input** → it answers `400` straight away, with a message for each field. The controller never runs.
- **Good input** → `req.body` is replaced with the cleaned-up version (trimmed, lowercased), and the controller runs.

So controllers can trust their input and stay short.

## Learn more

- [Zod basics](https://zod.dev/basics)
- [Input validation cheat sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
