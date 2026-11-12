// signup.html: create an account, then ask the user to check their email.

import { signUp } from '../api.js';
import { onSubmit, showMessage } from '../forms.js';
import { loadSession } from '../session.js';

const form = document.querySelector('#signup-form');

onSubmit(form, async (values) => {
  const { message } = await signUp(values);
  form.reset();
  showMessage(form, message, 'success');
});

loadSession();
