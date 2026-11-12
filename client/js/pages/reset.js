// reset.html: choose a new password, using the token from the emailed link.

import { resetPassword } from '../api.js';
import { getUrlParam, onSubmit } from '../forms.js';
import { loadSession } from '../session.js';

const form = document.querySelector('#reset-form');
const token = getUrlParam('token');
const lead = document.querySelector('.lead');

if (!token) {
  lead.textContent = 'This link is missing its code. Open the link from your email again.';
  form.hidden = true;
}

onSubmit(form, async ({ password }) => {
  const { message } = await resetPassword({ token, password });
  lead.textContent = message;
  form.hidden = true; // the link only works once
});

loadSession();
