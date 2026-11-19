// The contributors page: one card per person in contributors-list.js, showing their photo or their Open Peeps character.

import { loadSession } from '../session.js';
import { el } from '../render.js';
import { PEEPS, contributors } from '../contributors-list.js';

loadSession();

const TINTS = ['red', 'purple', 'green', 'blue', 'yellow'];

// Turns a name into the same number every time, so a person keeps the same peep and color on every visit.
function numberFromName(name) {
  let total = 0;
  for (const letter of name) total = (total * 31 + letter.charCodeAt(0)) % 100000;
  return total;
}

// Only https:// addresses, so a link like "javascript:..." can never run code on the page.
function isSafeUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function peepFor(person) {
  if (PEEPS.includes(person.peep)) return person.peep;
  return PEEPS[numberFromName(person.name) % PEEPS.length];
}

function renderPeep(person) {
  const img = el('img', 'illustration');
  img.src = `illustrations/${peepFor(person)}.svg`;
  img.alt = '';
  return img;
}

function renderPicture(person) {
  if (!isSafeUrl(person.photo)) return renderPeep(person);

  const img = el('img', 'contributor-photo');
  img.src = person.photo;
  img.alt = '';
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  // A broken photo link shouldn't leave an empty card, so swap in their peep.
  img.addEventListener('error', () => {
    img.parentElement.classList.remove('art--photo');
    img.replaceWith(renderPeep(person));
  }, { once: true });
  return img;
}

function renderCard(person) {
  const number = numberFromName(person.name);
  const art = el('div', `art tint-${TINTS[number % TINTS.length]}`);
  if (isSafeUrl(person.photo)) art.classList.add('art--photo');
  art.append(renderPicture(person));

  // The whole card is a link when the person gave one.
  const card = el(isSafeUrl(person.url) ? 'a' : 'div', 'card contributor-card');
  if (card.tagName === 'A') card.href = person.url;
  card.append(art, el('p', 'contributor-name', person.name));

  const item = el('li');
  item.append(card);
  return item;
}

const list = document.querySelector('#contributor-list');
list.replaceChildren(...contributors.map(renderCard));
document.querySelector('#contributor-count').textContent =
  contributors.length === 1 ? '1 person so far.' : `${contributors.length} people so far.`;
