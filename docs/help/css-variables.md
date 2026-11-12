# CSS variables

## The problem

Say our dark text color is `#191919`, and we use it in many places:

```css
body  { color: #191919; }
.card { border-color: #191919; }
.logo { color: #191919; }
```

If we want a different color later, we have to find and change every copy. Miss one, and the site looks broken.

## The fix: give the value a name, once

At the top of `public/css/base.css`:

```css
:root {
  --text: #191919;
}
```

- `:root` means "the whole page", so the name works everywhere.
- `--text` is the name we picked. Variable names always start with two dashes.

Then, wherever we need that color, we use the name inside `var( )`:

```css
body  { color: var(--text); }
.card { border-color: var(--text); }
.logo { color: var(--text); }
```

Now changing `#191919` in **one** place changes it on the whole site.

Think of it like a contact in your phone: you call "Mom", not the number. If the number changes, you update the contact once.

## Why Chalk needs this: themes

A theme just gives the same names new values:

```css
.profile {
  --bg: black;
  --text: white;
}
```

Every part of the page that uses `var(--bg)` and `var(--text)` switches colors, without the theme touching any other CSS. That's why a whole theme fits in one small file.

All of Chalk's variables are in the `:root` block at the top of `public/css/base.css`.

## Learn more

- [Using CSS custom properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [A complete guide to custom properties (CSS-Tricks)](https://css-tricks.com/a-complete-guide-to-custom-properties/)
