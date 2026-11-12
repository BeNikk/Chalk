# Environment variables (`.env`)

## What they are

Some values change depending on *where* the app runs:

| Setting | On your laptop | On the live site |
|---|---|---|
| `DATABASE_URL` | the Docker database | the Supabase database |
| `APP_URL` | `http://localhost:3000` | `https://chalk-client.vercel.app` |
| `RESEND_API_KEY` | empty (emails print in the terminal) | a real secret key |

Instead of writing these into the code, the app reads them from **environment variables**: named settings given to the program when it starts. In Node.js you read them with `process.env.NAME`.

## The `.env` file

On your laptop, settings live in a file called `.env` at the root of the project:

```
PORT=3000
DATABASE_URL=postgres://chalk:chalk@localhost:5433/chalk
```

`npm run dev` loads this file when the server starts. On the live site there's no `.env` file; the same settings are typed into Vercel's dashboard instead.

## Why secrets stay out of the code

The Chalk repository is **public**. Anything written in the code (or in a committed file) can be read by anyone on the internet, forever, even after you delete it.

So:

- `.env` is listed in `.gitignore` and **never committed**.
- `.env.example` **is** committed. It lists every setting with safe example values, so new contributors know what to set.
- API keys, passwords and personal emails only ever go in `.env` or the hosting dashboard.

## How Chalk reads them

`server/config.js` reads every setting once and hands them out as one `config` object:

```js
import config from './config.js';

app.listen(config.port);
```

If a required setting is missing, the server stops straight away with a message telling you which one to add.

## Learn more

- [How to read environment variables in Node.js (nodejs.org)](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [The Twelve-Factor App: Config](https://12factor.net/config) (why config lives outside the code)
