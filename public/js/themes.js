// The themes people can pick for their profile page. Each one is a CSS file in client/themes/.
// To add one, see docs/help/themes.md (scripts/check-themes.js makes sure this list is right).

export const THEMES = [
  { id: 'default', name: 'Classic' },
  { id: 'chalkboard', name: 'Chalkboard' },
];

// Loads the theme's CSS file. Unknown names are ignored, so a profile can never load any other file.
export function applyTheme(themeId) {
  if (!THEMES.some((theme) => theme.id === themeId)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `themes/${themeId}.css`;
  document.head.append(link);
}
