// login.html: log in, then go to the page you came from (or the feed).

import { logIn, resendVerification } from '../api.js';
import { getUrlParam, onSubmit, showMessage } from '../forms.js';
import { loadSession } from '../session.js';

const form = document.querySelector('#login-form');

// Only follow our own pages, like "write.html" or "post.html?id=7", so a crafted link
// can't send you to another site.
function pageToGoTo() {
  const next = getUrlParam('next');
  return next && /^[\w-]+\.html(\?[\w=&-]*)?$/.test(next) ? next : 'feed.html';
}

// Shown when the account exists but its email isn't verified yet.
function offerNewVerifyLink(email) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--small';
  button.textContent = 'Send me a new link';
  button.addEventListener('click', async () => {
    button.disabled = true; // one email per click
    try {
      const { message } = await resendVerification(email);
      showMessage(form, message, 'success');
    } catch (error) {
      showMessage(form, error.message);
    }
  });
  form.querySelector('.form-message').append(' ', button);
}

onSubmit(form, async (values) => {
  try {
    await logIn(values);
    window.location.href = pageToGoTo();
  } catch (error) {
    if (error.code !== 'EMAIL_NOT_VERIFIED') throw error;
    showMessage(form, error.message);
    offerNewVerifyLink(values.email);
  }
});

loadSession();
