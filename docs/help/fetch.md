# How the website talks to the server: fetch, async/await and modules

## The idea

Chalk's pages are plain HTML. When you click "Log in", the page's JavaScript sends your email and password to the server's API (`POST /api/auth/login`) and gets a JSON answer back. The page then updates itself, without reloading.

## fetch

`fetch` is built into every browser. It sends a request and gives back the response:

```js
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
```

`response.ok` is `true` for success (status 200 to 299). For errors, Chalk's API always answers `{ "error": "a message for people" }`.

## async and await

A request takes time. `await` means "wait here until it's done, then continue". A function that uses `await` must be marked `async`. If something goes wrong, the awaited call **throws an error**, which you catch with `try { … } catch (error) { … }`.

## Why everything goes through `public/js/api.js`

`api.js` has one small function per API address (`logIn`, `signUp`, `getMe`…), all built on one `request()` helper that:

- turns your data into JSON,
- reads the JSON answer,
- throws an error with the server's message when the server says no.

So pages just write `await logIn({ email, password })`, and the whole API is listed in one file.

## Modules: `import` and `export`

Each JavaScript file is a **module**. A file shares functions with `export`, and other files use them with `import`:

```js
// api.js
export function logIn(details) { … }

// pages/login.js
import { logIn } from '../api.js';
```

Pages load their script with `<script type="module" src="js/pages/login.js">`. Each page has its own small file in `public/js/pages/`, and shared code lives in `public/js/`.

## Learn more

- [Using the Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [async function (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [JavaScript modules (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
