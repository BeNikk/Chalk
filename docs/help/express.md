# Express

Express is the library Chalk's backend is built with. It receives requests from the browser and decides what to send back.

## Requests and responses

Every time the browser asks the server for something, that's a **request**: a method (`GET` to read, `POST` to create, `DELETE` to remove…) and a path (`/api/posts`). The server sends back a **response**: a status code (`200` OK, `404` not found…) and some content, usually JSON for Chalk's API.

## Routes

A route says "when a request comes in for *this* method and path, run *this* function":

```js
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});
```

- `req` (request) is what the browser sent: `req.body`, `req.params`, `req.query`.
- `res` (response) is how you answer: `res.json(...)`, `res.status(404)`.

## Middleware

Middleware is a function that runs on requests **before** (or instead of) your routes. `app.use(...)` adds one. Express runs them in the order they're written, top to bottom.

In `server/app.js`:

1. `express.json()` reads JSON sent by the browser and puts it in `req.body`.
2. `express.static(...)` sends files from `public/` (HTML, CSS, images) if the path matches one.
3. The routes, like `/api/health`.
4. A last `app.use('/api', ...)` that catches any API path nothing else matched, and answers `404`.

Because order matters, the "not found" handler always goes **last**.

## Why `app.js` and `index.js` are separate

`app.js` *builds* the app and exports it. `index.js` *starts* it with `app.listen(...)` on your laptop. On Vercel, there's no `listen`: Vercel imports the app from `app.js` and runs it itself.

## Learn more

- [Express: Hello world](https://expressjs.com/en/starter/hello-world.html) and [Basic routing](https://expressjs.com/en/starter/basic-routing.html)
- [Express: Using middleware](https://expressjs.com/en/guide/using-middleware.html)
- [An overview of HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [HTTP response status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
