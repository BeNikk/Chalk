# Contributing to Chalk

Welcome! Chalk is built by students, many of whom are making their very first open source contribution here. You don't need to be an expert. You need to be curious and willing to ask questions.

This guide covers:

1. [The one rule](#the-one-rule)
2. [Setting up](#setting-up)
3. [Picking an issue](#picking-an-issue)
4. [Making your change](#making-your-change)
5. [Opening a pull request](#opening-a-pull-request)
6. [Review](#review)
7. [Adding a drawing](#adding-a-drawing)
8. [Adding a theme](#adding-a-theme)
9. [How we write code](#how-we-write-code)
10. [Getting help](#getting-help)

---

## The one rule

**Only submit code you understand.**

You should be able to explain every line you changed, and why you did it that way. Reviewers will ask, and that conversation is how you learn.

Using AI tools, tutorials or Stack Overflow is fine *as long as you understand the result*. If you used an AI tool, say so in your pull request and explain the code in your own words. A small change you understand is worth more than a big one you don't.

Write your pull request description in your own words. Maintainers may ask you questions about it before merging.

---

## Setting up

You only do this once.

1. **Install [Git](https://git-scm.com/downloads)** and create a [GitHub account](https://github.com/signup) if you don't have one.
2. **Fork the repository.** On the [Chalk GitHub page](https://github.com/BeNikk/Chalk), click **Fork** (top right). This makes your own copy of Chalk on GitHub.
3. **Clone your fork** to your computer. Replace `YOUR-USERNAME` with your GitHub username:

   ```bash
   git clone https://github.com/YOUR-USERNAME/Chalk.git
   cd Chalk
   ```

4. **Connect to the original repository**, so you can get other people's changes later:

   ```bash
   git remote add upstream https://github.com/BeNikk/Chalk.git
   ```

5. **Install [Node.js](https://nodejs.org/) 22.18 or newer** and **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**, and open Docker Desktop. (On Linux, Docker Engine with the compose plugin works too.)
6. **Run it:**

   ```bash
   npm install
   npm run setup
   npm run dev
   ```

   Open http://localhost:3000 and log in as `inkyfox@chalk.test` with the password `chalk-dev-password`. The README lists the other fake users and every command.

### If setup goes wrong

| You see | Try this |
|---|---|
| `Docker is not running` | Open Docker Desktop, wait until it says it's running, then `npm run setup` again. |
| `node: bad option` or a syntax error on start | Your Node.js is too old. Check with `node --version`; you need 22.18 or newer. |
| `port is already allocated` (5433) | Something else uses that port, maybe an old Chalk database. Run `docker compose down`, or quit the other program. |
| `EADDRINUSE :3000` | Chalk is already running in another terminal. Stop it with `Ctrl+C`, or change `PORT` in your `.env` file. |
| `The table ... does not exist` | Your database is missing new tables. Run `npm run db:update`. |
| Anything else | Copy the whole error into your issue or the guild group. Someone will help. |

---

## Picking an issue

All work starts from an [issue](https://github.com/BeNikk/Chalk/issues). Issues have labels that tell you how hard they are and what part of the project they touch.

**How hard it is:**

| Label | Meaning |
|---|---|
| `first-timer` | Your very first PR. Tiny, with step-by-step hints. Only one per person, so everyone gets a turn. |
| `good-first-issue` | Small and well explained. Good for your 2nd to 5th PR. |
| `intermediate` | Needs you to read more of the code and make a few decisions. |

**What part of the project:**

| Label | Area |
|---|---|
| `frontend` | HTML, CSS, JavaScript in `client/` |
| `backend` | The API in `server/` |
| `themes` | Personal-page themes |
| `illustrations` | Drawings in `client/illustrations/` |
| `docs` | README, this guide, comments |

**To claim an issue:**

1. Find one that isn't assigned to anyone.
2. Comment: *"I'd like to work on this."*
3. Maintainers might assign you to fix the task.
4. Work on **one issue at a time**.

If you get stuck or lose interest, just comment so someone else can pick it up. No hard feelings.

Have an idea that isn't an issue yet? Open a new issue to discuss it first, before writing code.

---

## Making your change

1. **Get the latest code** before you start:

   ```bash
   git checkout main
   git pull upstream main
   npm install         # in case someone added a package
   npm run db:update   # in case someone added a database table
   ```

2. **Create a branch** for your change. Name it after what you're doing:

   ```bash
   git checkout -b fix-footer-links
   ```

3. **Make your change.** Keep it small and focused on the issue. If you spot something else to fix, open a separate issue for it.
4. **Check it.** Refresh the page and try it at phone width too (in your browser's developer tools), and take a screenshot. Then run `npm run lint` and `npm test`; CI runs the same checks on your pull request.
5. **Commit** with a message that says what you did:

   ```bash
   git add client/index.html
   git commit -m "Fix broken GitHub link in footer"
   ```

   Good messages: `Add #music sticky note color`, `Fix header overlapping notes on scroll`.
   Not helpful: `update`, `changes`, `fixed stuff`.

6. **Push** your branch to your fork:

   ```bash
   git push origin fix-footer-links
   ```

---

## Opening a pull request

1. Go to your fork on GitHub. You'll see a **Compare & pull request** button. Click it.
2. Fill in the template. It asks for:
   - **What** you changed
   - **Why** you chose that approach (were there other ways? why this one?)
   - A **screenshot** of it working on your computer
   - Which **issue** it fixes (write `Closes #12` so GitHub links them)
3. Click **Create pull request**.

**What makes a good PR:**

- **Small.** One issue, one PR. Under about 100 changed lines is ideal.
- **Explained.** A reviewer should understand it without asking what it does.
- **Tested.** You've looked at it in the browser yourself.
- **Clean.** No unrelated changes, leftover test code or commented-out code.

---

## Review

- Every PR needs **one approving review** and **passing automatic checks (CI)** before it's merged. If the checks fail, see [docs/help/ci.md](help/ci.md).
- A reviewer may ask questions or request changes. **This is normal and not a sign you did badly.** Even experienced developers get change requests on most PRs.
- To update your PR, make the changes on the same branch, commit and push again. The PR updates by itself.
- Be kind in reviews, both giving and receiving. Talk about the code, not the person.

---

## Adding a drawing

We'd love your drawings on the site. Any Open Peeps figure can be replaced by a student's drawing.

The full guide is in [`client/illustrations/README.md`](../client/illustrations/README.md). In short:

- Black lines on a transparent background, optionally with one soft pastel fill.
- Saved as an **SVG**, under 100 KB.
- Named clearly, like `carrying-boxes.svg`.
- Your own work (or CC0). Never trace someone else's art.

---

## Adding a theme

A theme changes how a profile page looks: colors, fonts, borders. Each theme is **one CSS file** in `client/themes/`, so adding one is a small, fun pull request.

```css
/* client/themes/midnight.css: dark blue, still easy to read */
.profile {
  --bg: #11132b;
  --surface: #1b1e3d;
  --text: #f4f1ff;
  --text-muted: #b9b4d9;
  --border: #3a3e6b;
}
```

The step-by-step guide, with the list of variables you can change, is in [docs/help/themes.md](help/themes.md). `npm run lint` checks that your theme only styles the profile page.

---

## How we write code

- **Plain HTML, CSS and JavaScript.** No frameworks, no preprocessors, no build step.
- **Readable over clever.** Clear names, short functions, nothing fancy if something simple works.
- **Comment the *why*, not the *what*.** `/* sticky so the nav stays reachable */` is useful. `/* set position to sticky */` is not.
- **CSS:**
  - Colors and fonts come from the CSS variables in `base.css`. Don't type a new color directly; use a variable, or add one there.
  - `layout.css` decides *where* things go. `components.css` decides how single pieces *look*.
  - Use flexbox and grid, and check that your change works on a phone-sized screen.
  - Keep animations small, and make sure they don't get in the way of reading or writing.
- **Backend:**
  - Each request goes route → controller → model. Database code (Prisma) only lives in `server/models/`.
  - Check every request body with a Zod schema in `server/schemas/`.
  - Never send private data (emails, password hashes) in answers. Use the `toPublic…` functions in the models.
  - Add or update a test in `tests/` for any API change. Copy a nearby test and change it.
  - Changing `prisma/schema.prisma`? Run `npm run db:migrate -- --name what_changed` and commit the new migration.
- **People's words:** show anything a user wrote with `textContent`, never `innerHTML` (see [docs/help/dom.md](help/dom.md)).
- **Accessibility:** images need `alt` text (use `alt=""` for decoration), and text must be readable against its background.
- **Stuck on an idea in the code?** The [help pages](help/README.md) explain each one, with links to learn more.

---

## Getting help

- **Stuck on an issue?** Comment on it and describe what you tried. Questions are welcome; nobody expects you to know everything.
- **Not sure where to start?** Ask in the guild group, or open an issue with your question.
- **Git went wrong?** It happens to everyone. Ask, and someone will help you untangle it.

Thank you for helping build Chalk, Welcome to your Open source journey!
