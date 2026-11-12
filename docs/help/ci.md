# CI: the automatic checks on every pull request

## What CI is

**CI** (continuous integration) means a computer checks every change automatically. When you open a pull request, GitHub starts a fresh machine, downloads your version of Chalk, and runs the same checks you can run yourself. You'll see the result at the bottom of your pull request: a green ✓ or a red ✗.

Maintainers only merge a pull request when the checks pass **and** someone has approved it.

## What it checks

The steps are in `.github/workflows/ci.yml`:

| Step | Command | Fails when… |
|---|---|---|
| Install packages | `npm ci` | `package.json` and `package-lock.json` don't match |
| Lint | `npm run lint` | ESLint finds a mistake, or a theme breaks the theme rules |
| Schema | `npx prisma validate` | `prisma/schema.prisma` has an error |
| Tests | `npm test` | any test fails (CI gets its own empty Postgres database) |
| Smoke test | starts the server, asks `/api/health` | the server crashes on startup |

## When it's red

1. Click **Details** next to the red ✗ on your pull request.
2. Open the step with the red mark and scroll to the end; the error is usually in the last few lines.
3. Run the same command on your laptop (for example `npm run lint` or `npm test`), fix it, commit, and push. CI runs again by itself. (`npm test` needs the local database running: `npm run setup` starts it.)

Stuck? Comment on your pull request with what you tried. A red CI run is normal and nothing to worry about; it's there to catch mistakes before anyone else sees them.

## Learn more

- [GitHub Actions: quickstart](https://docs.github.com/en/actions/writing-workflows/quickstart)
- [About status checks (GitHub)](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
