// Knows who is logged in, and updates the header links to match.

import { getMe, logOut } from './api.js';
import { menuLink, setUpPhoneMenu } from './menu.js';

function link(href, text, className = 'nav-link') {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.className = className;
  return a;
}

function logOutButton(className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = 'Log out';
  button.addEventListener('click', async () => {
    try {
      await logOut();
    } finally {
      window.location.href = '/index.html';
    }
  });
  return button;
}

function showLoggedInNav(nav, user) {
  // Links start with / so they work from any address, even the 404 page at /some/missing/page.
  nav.replaceChildren(
    link('/feed.html', 'Feed', 'nav-link nav-link--extra'),
    link('/rules.html', 'Rules', 'nav-link nav-link--extra'),
    link(`/profile.html?handle=${user.handle}`, `@${user.handle}`, 'nav-link nav-link--extra'),
    logOutButton('nav-link nav-button nav-link--extra'),
    link('/write.html', 'Write', 'button button--primary button--small'),
  );
}

// Everything the header has on a laptop, for the phone menu.
function phoneMenuItems(user) {
  const items = [menuLink('/feed.html', 'Feed'), menuLink('/rules.html', 'Rules')];
  if (user) {
    items.push(
      menuLink(`/profile.html?handle=${user.handle}`, `My profile (@${user.handle})`),
      menuLink('/settings.html', 'Settings'),
      logOutButton('phone-menu-link'),
    );
  } else {
    items.push(menuLink('/login.html', 'Log in'), menuLink('/signup.html', 'Sign up'));
  }
  return items;
}

// Call this on every page. Returns the logged-in user, or null.
export async function loadSession() {
  const user = await getMe();
  const nav = document.querySelector('.site-nav');
  if (user && nav) {
    showLoggedInNav(nav, user);
  }
  if (nav) {
    setUpPhoneMenu(nav.closest('.site-header'), phoneMenuItems(user));
  }
  return user;
}

// Sends someone to the login page, and back to this page afterwards.
export function goToLogin() {
  const page = window.location.pathname.split('/').pop() + window.location.search;
  window.location.href = `login.html?next=${encodeURIComponent(page)}`;
}

// Authors can delete their own posts and comments; moderators and the admin can delete anything.
export function canDelete(authorHandle, user) {
  if (!user) return false;
  return authorHandle === user.handle || user.role === 'MODERATOR' || user.role === 'ADMIN';
}
