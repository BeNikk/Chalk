# Help

Short explanations of the ideas used in Chalk's code. Each page explains one idea in plain words, shows a tiny example, and links to the best places to learn more.

When a comment in the code says *"See docs/help/…"*, this is where it points.

| Page | What it explains | Used in |
|---|---|---|
| [CSS variables](css-variables.md) | Naming a value once and reusing it everywhere (`--text`, `var(--text)`) | `public/css/`, themes |
| [Themes](themes.md) | Making your own profile theme, step by step | `public/themes/` |
| [Environment variables](environment-variables.md) | Settings and secrets in `.env`, and why they stay out of the code | `server/config.js`, `.env.example` |
| [Express](express.md) | How the server answers requests: middleware, routes, JSON | `server/app.js` |
| [The API](api.md) | Every API address, methods, status codes, and what a post looks like | `server/routes/` |
| [Databases](databases.md) | Tables, rows, columns, relations, and where Chalk's database runs | `prisma/schema.prisma` |
| [Prisma](prisma.md) | The schema, migrations, seeding, and the `db:` commands | `prisma/`, `server/db.js` |
| [Passwords](passwords.md) | Why we store hashes, not passwords, and how bcrypt works | `server/services/passwords.js` |
| [Sessions and cookies](sessions.md) | How the server remembers who's logged in | `server/session.js` |
| [Email links](email-links.md) | Verify and reset-password links, and why only hashes are stored | `server/services/tokens.js`, `server/services/email.js` |
| [Validation](validation.md) | Checking every request with Zod schemas | `server/schemas/`, `server/middleware/validate.js` |
| [Uploads](uploads.md) | Profile photos: FormData, Multer, Cloudinary, and hidden photo data | `server/services/photos.js` |
| [Tests](testing.md) | Running and writing tests | `tests/` |
| [CI](ci.md) | The automatic checks on every pull request, and what to do when they're red | `.github/workflows/ci.yml` |
| [The DOM](dom.md) | Building the page from data with JavaScript, and why we never use innerHTML for people's words | `public/js/render.js` |
| [fetch and modules](fetch.md) | How pages call the API with fetch, async/await, and import/export | `public/js/api.js`, `public/js/pages/` |

## Missing something?

If something in the code confused you, that's a sign a help page is missing or unclear. Open an issue saying what confused you. Writing or improving a help page is a great contribution.
