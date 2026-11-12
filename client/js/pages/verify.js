// verify.html: opened from the email link. Sends the token to the server straight away.

import { resendVerification, verifyEmail } from '../api.js';
import { getUrlParam, onSubmit, showMessage } from '../forms.js';
import { loadSession } from '../session.js';

const heading = document.querySelector('h1');
const lead = document.querySelector('.lead');
const resendForm = document.querySelector('#resend-form');

async function verify() {
  try {
    const { message } = await verifyEmail(getUrlParam('token') || '');
    heading.textContent = 'You’re verified!';
    lead.textContent = message;
  } catch (error) {
    heading.textContent = 'That link didn’t work';
    lead.textContent =
      error.status === 400
        ? 'It may have expired or already been used. Enter your email and we’ll send a new one.'
        : error.message;
    resendForm.hidden = false;
  }
}

onSubmit(resendForm, async ({ email }) => {
  const { message } = await resendVerification(email);
  showMessage(resendForm, message, 'success');
});

verify();
loadSession();
