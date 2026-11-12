// write.html: write a new post. You need to be logged in.

import { createPost } from '../api.js';
import { onSubmit } from '../forms.js';
import { loadSession } from '../session.js';

const form = document.querySelector('#write-form');
const body = document.querySelector('#body');
const counter = document.querySelector('#body-count');

// Show how much of the 5000-character limit is used, so nobody loses a long post.
body.addEventListener('input', () => {
  counter.textContent = `${body.value.length} / 5000`;
});

onSubmit(form, async (values) => {
  const { post } = await createPost(values);
  window.location.href = `post.html?id=${post.id}`;
});

const user = await loadSession();
if (user) {
  form.hidden = false;
} else {
  window.location.href = 'login.html?next=write.html';
}
