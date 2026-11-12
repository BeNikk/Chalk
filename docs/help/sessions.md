# Sessions and cookies: how the server remembers you

## The problem

Every request to the server is separate. When your browser asks for `/api/me`, the server has no memory of the login you did a minute ago. Something has to say "this is still me".

## The fix: a session plus a cookie

1. You log in with the right email and password.
2. The server creates a **session**: a row in the `Session` table that says "session `abc123` belongs to user 5".
3. It sends your browser a **cookie** called `chalk.sid` holding just that id, `abc123`.
4. The browser automatically sends the cookie with every later request to the same site.
5. The server looks up `abc123`, finds user 5, and knows who you are.

Logging out deletes the session, so the cookie stops working.

Not built yet: changing your password doesn't log out your *other* devices. That would be a good contribution.

In Chalk, `server/session.js` sets this up, and `server/middleware/requireSignIn.js` looks up the user for routes that need one.

## The cookie's safety settings

| Setting | What it protects against |
|---|---|
| `httpOnly` | JavaScript on the page can't read the cookie, so a sneaky script can't steal your login |
| `sameSite: 'lax'` | Other websites can't make your browser send Chalk requests with your cookie |
| `secure` (live site only) | The cookie is only ever sent over HTTPS, never plain HTTP |

And on every login the session gets a **brand-new id** (`regenerate`), so an old id someone may have seen can't be reused.

## Why not keep the session in the browser?

Some apps put the whole login inside the cookie or in `localStorage` (a "JWT"). Keeping it in the database is simpler to reason about: logging out really ends it, and nothing secret lives in the browser except a random id.

## Learn more

- [Using HTTP cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [express-session documentation](https://expressjs.com/en/resources/middleware/session.html)
- [Session management cheat sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
