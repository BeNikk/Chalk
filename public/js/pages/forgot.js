// forgot.html: ask for a link to reset your password.

import { forgotPassword } from '../api.js';
import { onSubmit, showMessage } from '../forms.js';
import { loadSession } from '../session.js';

const form = document.querySelector('#forgot-form');

onSubmit(form, async ({ email }) => {
  const { message } = await forgotPassword(email);
  showMessage(form, message, 'success');
});

loadSession();
