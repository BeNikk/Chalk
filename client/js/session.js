// Knows who is logged in, and updates the header links to match.

import { getMe, logOut } from './api.js';

function link(href, text, className = 'nav-link') {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.className = className;
  return a;
}

function showLoggedInNav(nav, user) {
  const logOutButton = document.createElement('button');
  logOutButton.type = 'button';
  logOutButton.className = 'nav-link nav-button';
  logOutButton.textContent = 'Log out';
  logOutButton.addEventListener('click', async () => {
    try {
      await logOut();
    } finally {
      window.location.href = '/index.html';
    }
  });

  // Links start with / so they work from any address, even the 404 page at /some/missing/page.
  nav.replaceChildren(
    link('/feed.html', 'Feed', 'nav-link nav-link--extra'),
    link('/rules.html', 'Rules', 'nav-link nav-link--extra'),
    link(`/profile.html?handle=${user.handle}`, `@${user.handle}`, 'nav-link nav-link--extra'),
    logOutButton,
    link('/write.html', 'Write', 'button button--primary button--small'),
  );
}

// Call this on every page. Returns the logged-in user, or null.
export async function loadSession() {
  const user = await getMe();
  const nav = document.querySelector('.site-nav');
  if (user && nav) {
    showLoggedInNav(nav, user);
  }
  return user;
}

// Authors can delete their own posts and comments; moderators and the admin can delete anything.
export function canDelete(authorHandle, user) {
  if (!user) return false;
  return authorHandle === user.handle || user.role === 'MODERATOR' || user.role === 'ADMIN';
}
