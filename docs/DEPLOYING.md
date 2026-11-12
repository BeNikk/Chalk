# Deploying Chalk

How the live site at **https://chalk-client.vercel.app** is set up. This is for maintainers; contributors never need to deploy.

```
Browser ──> Vercel (one project)
              ├── public/   the website, served as files by Vercel's CDN
              └── app.js    the Express API (/api/...), run as a Vercel Function
                    ├── Supabase   Postgres database
                    ├── Resend     emails from biznudge.in
                    └── Cloudinary profile photos
```

Because the website and the API are on the same address, the login cookie just works and there's no CORS to set up.

## 1. Database: Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Connect** and copy two connection strings:
   - **Transaction pooler** (port **6543**) → this is `DATABASE_URL`. The app uses it; it copes with many short-lived Vercel functions.
   - **Direct connection** (port **5432**), or the **Session pooler** if your network has no IPv6 → this is `DIRECT_URL`. Only used to create and update tables.
3. Replace `[YOUR-PASSWORD]` in both with the database password.
4. Add `?sslmode=no-verify` to the end of both strings (or `&sslmode=no-verify` if there's already a `?`). The connection is still encrypted; this just skips a certificate check that otherwise fails with Supabase's own certificates ("self-signed certificate" errors).

The tables are created automatically on every **production** deploy (`scripts/vercel-build.js` runs `prisma migrate deploy`). Preview deploys never touch the database's tables.

## 2. Email: Resend with biznudge.in

1. Create an account at [resend.com](https://resend.com) and an **API key** → `RESEND_API_KEY`.
2. **Domains → Add domain → `biznudge.in`**. Resend shows a few DNS records (SPF, DKIM); add them where biznudge.in's DNS is managed, then click **Verify**.
3. Choose the sender, e.g. `EMAIL_FROM=Chalk <hello@biznudge.in>`.

The free plan sends up to 100 emails a day.

## 3. Photos: Cloudinary

1. Create an account at [cloudinary.com](https://cloudinary.com).
2. Copy the **API environment variable** from the dashboard (it looks like `cloudinary://key:secret@cloud-name`) → `CLOUDINARY_URL`.

## 4. Vercel

1. Open the existing **chalk-client** project → **Settings**:
   - **Root Directory**: the repository root (empty), not a subfolder.
   - **Framework Preset**: **Express** (not "Other"; Express is how Vercel finds `app.js`). The build command comes from `vercel.json`.
2. **Settings → Environment Variables**, for the **Production** environment:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://chalk-client.vercel.app` |
   | `SESSION_SECRET` | a long random string, e.g. from `openssl rand -hex 32` |
   | `DATABASE_URL` | Supabase transaction pooler string (port 6543) |
   | `DIRECT_URL` | Supabase direct / session pooler string (port 5432) |
   | `ADMIN_EMAIL` | the admin's email address |
   | `RESEND_API_KEY` | from Resend |
   | `EMAIL_FROM` | `Chalk <hello@biznudge.in>` |
   | `CLOUDINARY_URL` | from Cloudinary |

   The server refuses to start in production if any required one is missing, and says which.

   **Preview deploys** (Vercel builds one for every pull request) need their own values too, or they crash. Simplest: give Preview its own free Supabase project and its own `SESSION_SECRET`, and reuse the rest. Never point Preview's `DATABASE_URL` at the live database.
3. **Settings → General → Node.js Version**: 24.x (or newer). Chalk needs Node 22.18 or later.
4. Redeploy (**Deployments → … → Redeploy**), or push to `main`.

## 5. Check the live site

Go through this list after the first deploy, and after big changes:

- [ ] `https://chalk-client.vercel.app/api/health` shows `{"ok":true}`
- [ ] The landing page, feed and rules pages load, with styles and illustrations
- [ ] Sign up with a real email → the verify email arrives from biznudge.in → the link works
- [ ] Log in, refresh the page: you're still logged in (the cookie works)
- [ ] Sign up and verify with `ADMIN_EMAIL` → Settings shows the Moderators section
- [ ] Write a post, like it, comment, share the link and open it in a private window
- [ ] Upload a profile photo: it shows up square, and the image address is on `res.cloudinary.com`
- [ ] Forgot password → the reset email arrives and works
- [ ] `https://chalk-client.vercel.app/some/missing/page` shows the Page not found page

## Troubleshooting

- **`P1001: Can't reach database server at db.….supabase.co`** during the build: the Direct connection only works over IPv6, and Vercel uses IPv4. Use the **Session pooler** string (`….pooler.supabase.com:5432`) for `DIRECT_URL`.
- **The API works but every page says Page not found**: Vercel only serves website files that are in `public/` in the repository. A folder made during the build isn't served. Keep the website in `public/`.
- **Every address shows the landing page, and logging in or signing up fails with `405`**: Vercel is deploying only the website. Set **Framework Preset** to **Express**, turn off the Output Directory override, and redeploy without the build cache.
- **`No entrypoint found which imports express`**: the root `app.js` must import `express` itself (it wraps `server/app.js` in a small Express app). Don't shorten it to a one-line re-export.
- **The build says the database was not updated** on a production deploy: add `DIRECT_URL` to the Production environment variables.
- **Database SSL errors** (`P1010`, "self-signed certificate"): check both connection strings end with `sslmode=no-verify` (step 1.4), or follow [Prisma's SSL notes](https://www.prisma.io/docs/orm/overview/databases/postgresql).
- **`The pattern "app.js" defined in functions doesn't match any Serverless Functions`**: `vercel.json` must not have a `functions` section; Vercel finds `app.js` by itself when the Framework Preset is **Express**.
- **The API crashes with `Cannot find module … generated/prisma`**: the build didn't include Prisma's generated code. Check the build log shows `prisma generate` ran during install. The schema must use the `prisma-client-js` generator: the newer `prisma-client` one writes TypeScript files, which Vercel renames to `.js`, so the server can't find them.
- **Emails don't arrive**: check the domain shows *Verified* in Resend, and look at **Resend → Emails** for errors.
- **Function logs**: Vercel → the project → **Logs** shows server errors.

## Protecting `main`

So that nothing reaches the live site without passing CI and a review, turn on branch protection once (GitHub → **Settings → Branches → Add rule** for `main`):

- Require a pull request before merging, with **1 approval**
- Require status checks to pass: **check** (the CI job)

Or with the GitHub CLI, after `gh auth login`:

```bash
gh api -X PUT repos/BeNikk/Chalk/branches/main/protection \
  -F 'required_pull_request_reviews[required_approving_review_count]=1' \
  -F 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=check' \
  -F enforce_admins=false \
  -F restrictions=null
```
