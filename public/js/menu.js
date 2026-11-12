// The "Menu" button on phones. Small screens hide some header links, so this opens a list with all of them.
// aria-expanded tells screen readers whether the list is open.

function menuLink(href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.className = 'phone-menu-link';
  return a;
}

// `items` are links, plus a button for "Log out" when logged in.
export function setUpPhoneMenu(header, items) {
  const panel = document.createElement('nav');
  panel.id = 'phone-menu';
  panel.className = 'phone-menu';
  panel.setAttribute('aria-label', 'Menu');
  panel.hidden = true;
  panel.append(...items);
  header.append(panel);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-button';
  button.textContent = 'Menu';
  button.setAttribute('aria-controls', 'phone-menu');
  button.setAttribute('aria-expanded', 'false');
  header.querySelector('.site-nav').prepend(button);

  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Menu';
  }

  button.addEventListener('click', () => setOpen(panel.hidden));
  // Escape, or a tap anywhere outside the header, closes it.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
}

export { menuLink };
