// Part of `npm run lint`. Checks the themes in public/themes/:
// 1. they only style things inside `.profile`, so a theme can't change the rest of the site,
// 2. they don't load anything from other websites (no @import or url()), and
// 3. the theme lists (server/schemas/users.js and public/js/themes.js) match the files.

import { readdirSync, readFileSync } from 'node:fs';
import { THEMES as serverThemes } from '../server/schemas/users.js';
import { THEMES as clientThemes } from '../public/js/themes.js';

const folder = 'public/themes';
const problems = [];

// Every selector, i.e. the text before each `{`, split at commas. Keyframe steps are left out.
function selectorsIn(css) {
  return [...css.matchAll(/([^{};]+)\{/g)]
    .flatMap((match) => match[1].split(','))
    .map((selector) => selector.trim())
    .filter((selector) => !/^(from|to|\d+%)$/.test(selector));
}

// `.profile` itself, or something inside it like `.profile .post-card` or `.profile:hover`.
// Not `.profile + footer` or `.profile ~ *`, which would reach things outside the profile.
function staysInsideProfile(selector) {
  return /^\.profile($|[\s.:[#>])/.test(selector) && !/[+~]/.test(selector);
}

const files = readdirSync(folder).filter((name) => name.endsWith('.css'));

for (const file of files) {
  const css = readFileSync(`${folder}/${file}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); // no comments
  const id = file.replace('.css', '');

  if (/@import|@font-face|url\(/.test(css)) {
    problems.push(`${file}: don't load files from other websites (@import, @font-face or url())`);
  }
  for (const selector of selectorsIn(css)) {
    if (!selector.startsWith('@') && !staysInsideProfile(selector)) {
      problems.push(`${file}: "${selector}" must be inside .profile`);
    }
  }
  if (!serverThemes.includes(id)) {
    problems.push(`${file}: add '${id}' to THEMES in server/schemas/users.js`);
  }
  if (!clientThemes.some((theme) => theme.id === id)) {
    problems.push(`${file}: add { id: '${id}', name: '…' } to THEMES in public/js/themes.js`);
  }
}

// And the other way round: every listed theme needs its CSS file.
const themeIds = new Set([...serverThemes, ...clientThemes.map((theme) => theme.id)]);
for (const id of themeIds) {
  if (!files.includes(`${id}.css`)) {
    problems.push(`'${id}' is listed as a theme, but public/themes/${id}.css doesn't exist`);
  }
}

if (problems.length > 0) {
  console.error(`Theme problems:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Themes look good.');
