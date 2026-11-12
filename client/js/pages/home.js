// Pages that only need the header to know who's logged in: the landing page, rules, and 404.

import { loadSession } from '../session.js';

const user = await loadSession();

// On the landing page, logged-in people get "Write something" instead of "Start writing" (sign up).
const heroButton = document.querySelector('.hero .button--primary');
if (user && heroButton) {
  heroButton.href = 'write.html';
  heroButton.textContent = 'Write something';
}
