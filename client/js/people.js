// A pop-up list of people: "Liked by", "Followers", "Following". It's a <dialog>, a pop-up box built into HTML: showModal() opens it,
// dims the page behind it, and the Escape key closes it. See docs/help/dom.md

import { el, renderAvatar } from './render.js';

let dialog;
let title;
let list;

// The pop-up is made once, the first time someone opens it, and reused after that.
function createDialog() {
  dialog = el('dialog', 'dialog');
  dialog.setAttribute('aria-labelledby', 'people-title');

  const box = el('div', 'dialog-box');
  const header = el('div', 'dialog-header');
  title = el('h2');
  title.id = 'people-title';
  const closeButton = el('button', 'action-button', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', () => dialog.close());
  header.append(title, closeButton);

  list = el('ul', 'people-list');
  box.append(header, list);
  dialog.append(box);

  // A click that lands on the dialog itself (not the box inside) was on the dimmed background.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);
}

function renderPerson(person) {
  const link = el('a', 'post-author');
  link.href = `profile.html?handle=${person.handle}`;
  link.append(renderAvatar(person), `@${person.handle}`);
  const item = el('li');
  item.append(link);
  return item;
}

// openPeopleList('Liked by', () => getLikers(42), 'No likes yet.')
// `loadPeople` is a function that asks the API, so the list loads after the pop-up opens.
export async function openPeopleList(heading, loadPeople, emptyMessage) {
  if (!dialog) createDialog();
  title.textContent = heading;
  list.replaceChildren(el('li', 'muted', 'Loading…'));
  dialog.showModal();

  try {
    const { people } = await loadPeople();
    list.replaceChildren(...people.map(renderPerson));
    if (people.length === 0) list.append(el('li', 'muted', emptyMessage));
  } catch (error) {
    list.replaceChildren(el('li', 'muted', error.message));
  }
}
