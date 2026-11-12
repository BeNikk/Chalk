# Themes: make your own profile style

Every Chalk user can pick a **theme** for their profile page. A theme is **one CSS file**, so adding one is a great first contribution.

## How themes work

The profile page wraps everything in `<main class="profile">`. A theme gives new values to Chalk's CSS variables, but only inside `.profile`:

```css
/* public/themes/midnight.css */
.profile {
  --bg: #11132b;
  --surface: #1b1e3d;
  --text: #f4f1ff;
  --text-muted: #b9b4d9;
  --border: #3a3e6b;
}
```

Every card, chip and button on the profile uses those variables, so they all switch colors together. The rest of the site (header, feed, settings) stays the same for everyone. New to CSS variables? See [css-variables.md](css-variables.md).

## Variables you can change

| Variable | What it colors |
|---|---|
| `--bg` | The page background |
| `--surface` | Post cards |
| `--text`, `--text-muted` | Main text, and quieter text like dates |
| `--border` | Thin lines around cards and buttons |
| `--font`, `--font-heading` | Body text and headings |
| `--label-rant` … `--label-fixit` | The color of each label |
| `--tint-red`, `--tint-purple` | Liked hearts, and the letter avatar |

You can also add rules for things inside the profile, like `.profile .post-card { border-style: dashed; }`.

## Adding your theme, step by step

1. Copy `public/themes/default.css` to `public/themes/your-theme.css` (lowercase, dashes).
2. Change the variables. Make sure text is easy to read on the background (try the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)).
3. Add it to **both** theme lists:
   - `public/js/themes.js`: `{ id: 'your-theme', name: 'Your Theme' }`
   - `server/schemas/users.js`: `'your-theme'` in `THEMES`
4. Run `npm run lint`. It checks that your file only styles things inside `.profile` and that it's in both lists.
5. Pick your theme in Settings, open your profile, and take a screenshot for your pull request.

## Rules

- Only style things inside `.profile` (the lint check enforces this).
- Keep it readable: no flashing animations, and enough contrast to read comfortably.
- Fonts: use one that's already loaded (Bricolage Grotesque, DM Sans, Caveat), or a system font like `Georgia` or `monospace`.

## Learn more

- [Using CSS custom properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Color contrast (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast)
