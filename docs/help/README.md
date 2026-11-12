# Help

Short explanations of the ideas used in Chalk's code. Each page explains one idea in plain words, shows a tiny example, and links to the best places to learn more.

When a comment in the code says *"See docs/help/…"*, this is where it points.

| Page | What it explains | Used in |
|---|---|---|
| [CSS variables](css-variables.md) | Naming a value once and reusing it everywhere (`--text`, `var(--text)`) | `client/css/`, themes |
| [Environment variables](environment-variables.md) | Settings and secrets in `.env`, and why they stay out of the code | `server/config.js`, `.env.example` |
| [Express](express.md) | How the server answers requests: middleware, routes, JSON | `server/app.js` |

## Missing something?

If something in the code confused you, that's a sign a help page is missing or unclear. Open an issue saying what confused you. Writing or improving a help page is a great contribution.
