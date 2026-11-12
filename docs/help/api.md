# Chalk's API

The website is just one **client** of Chalk's API. Anything that can send HTTP requests (a Telegram bot, a phone app, a command-line tool) can use the same API. This page lists it.

## How it works

- Every address starts with `/api`.
- Requests and answers are **JSON**.
- Errors always look like `{ "error": "a message you can show people" }`. Form errors also have `"fields": { "email": ["…"] }`.
- Logging in sets a cookie (`chalk.sid`); send it back with later requests. See [sessions.md](sessions.md).

### Methods

| Method | Means |
|---|---|
| `GET` | Read something |
| `POST` | Create something, or do an action (log in) |
| `PUT` | Set something (like a post) |
| `PATCH` | Change part of something |
| `DELETE` | Remove something |

### Status codes Chalk uses

| Code | Means |
|---|---|
| `200` / `201` | OK / created |
| `400` | Your input has a problem (the message says what) |
| `401` | You need to log in |
| `403` | You're logged in, but not allowed to do that |
| `404` | Not found (also for ids that aren't numbers, or posts that were deleted) |
| `409` | Already taken (email, handle) |
| `429` | Too many tries, wait a bit |
| `500` | Something broke on the server |

## Accounts

| Method | Address | Who | Does |
|---|---|---|---|
| POST | `/api/auth/signup` | anyone | `{ email, password, handle }` → creates an account and emails a verify link |
| POST | `/api/auth/verify` | anyone | `{ token }` → verifies the email |
| POST | `/api/auth/resend-verification` | anyone | `{ email }` → sends a new verify link |
| POST | `/api/auth/login` | anyone | `{ email, password }` → logs in |
| POST | `/api/auth/logout` | anyone | logs out |
| POST | `/api/auth/forgot-password` | anyone | `{ email }` → emails a reset link |
| POST | `/api/auth/reset-password` | anyone | `{ token, password }` → sets a new password |
| GET | `/api/me` | logged in | your account |
| PATCH | `/api/me` | logged in | `{ bio?, theme? }` → changes your bio or theme |
| PUT | `/api/me/avatar` | logged in | a file in the form field `photo` (JPG/PNG/WebP, max 2 MB) → sets your photo |
| DELETE | `/api/me/avatar` | logged in | removes your photo |

## Profiles

| Method | Address | Who | Does |
|---|---|---|---|
| GET | `/api/users/:handle` | anyone | `{ "user": { handle, bio, theme, avatarUrl, role, joinedAt, followerCount, followingCount, followedByMe } }` (never the email) |
| GET | `/api/users/:handle/posts?before=42` | anyone | that user's posts, like the feed |
| PUT | `/api/users/:handle/follow` | logged in | follows them (not yourself) → `{ "followerCount": 4, "followedByMe": true }` |
| DELETE | `/api/users/:handle/follow` | logged in | unfollows them |
| GET | `/api/users/:handle/followers` | anyone | `{ "people": [ { handle, avatarUrl } ] }`, newest first, up to 100 |
| GET | `/api/users/:handle/following` | anyone | who they follow, the same shape |

## Admin

| Method | Address | Who | Does |
|---|---|---|---|
| GET | `/api/admin/moderators` | admin | `{ "moderators": [ … ] }` |
| PUT | `/api/admin/moderators/:handle` | admin | makes that user a moderator |
| DELETE | `/api/admin/moderators/:handle` | admin | makes them a normal user again |

## Posts and likes

| Method | Address | Who | Does |
|---|---|---|---|
| GET | `/api/posts?label=rant&before=42` | anyone | 20 newest posts. `label` and `before` (load older posts) are optional. `following=true` (logged in): only people you follow |
| POST | `/api/posts` | logged in | `{ label, title?, body }` → writes a post |
| GET | `/api/posts/:id` | anyone | one post |
| DELETE | `/api/posts/:id` | author, moderator, admin | deletes a post |
| PUT | `/api/posts/:id/like` | logged in | likes a post |
| DELETE | `/api/posts/:id/like` | logged in | unlikes it |
| GET | `/api/posts/:id/likes` | anyone | who liked it: `{ "people": [ { "handle", "avatarUrl" } ] }`, newest first, up to 100 |

- The feed answers `{ "posts": [ … ] }`; a single post answers `{ "post": { … } }`.
- To load older posts, pass `before` = the `id` of the last post you already have. An empty list means there are no more.
- Like and unlike answer `{ "likeCount": 3, "likedByMe": true }`. Liking twice is harmless.
- Labels are `rant`, `poetry`, `mess`, `music` and `fixit`; any other `label` gives `400`.

## What a post looks like

```json
{
  "id": 7,
  "label": "rant",
  "title": null,
  "body": "8am classes should be illegal.",
  "createdAt": "2026-11-12T09:30:00.000Z",
  "author": { "handle": "inkyfox", "avatarUrl": null },
  "likeCount": 2,
  "commentCount": 0,
  "likedByMe": false
}
```

## Comments

| Method | Address | Who | Does |
|---|---|---|---|
| GET | `/api/posts/:id/comments` | anyone | the post's comments, oldest first → `{ "comments": [ … ] }` |
| POST | `/api/posts/:id/comments` | logged in | `{ body }` (1 to 1000 characters) → `{ "comment": { … } }` |
| DELETE | `/api/comments/:id` | author, moderator, admin | deletes a comment → `{ "message": "Comment deleted." }` |

A comment looks like `{ "id", "postId", "body", "createdAt", "author": { "handle", "avatarUrl" } }`. If the post doesn't exist (or was deleted), both comment routes answer `404`.

## Learn more

- [An overview of HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [HTTP request methods (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- [HTTP response status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
