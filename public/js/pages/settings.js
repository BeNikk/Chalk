// settings.html: your photo, bio and theme. The admin also chooses moderators here.

import {
  addModerator,
  getModerators,
  removeAvatar,
  removeModerator,
  updateMe,
  uploadAvatar,
} from '../api.js';
import { onSubmit, showMessage } from '../forms.js';
import { el, renderAvatar } from '../render.js';
import { loadSession } from '../session.js';
import { THEMES } from '../themes.js';

const photoForm = document.querySelector('#photo-form');
const profileForm = document.querySelector('#profile-form');
const moderatorForm = document.querySelector('#moderator-form');

// ---------- Photo ----------

function showPhoto(user) {
  document.querySelector('#photo-preview').replaceChildren(renderAvatar(user, 'large'));
  document.querySelector('#remove-photo').hidden = !user.avatarUrl;
}

function setUpPhoto(user) {
  showPhoto(user);

  onSubmit(photoForm, async () => {
    const file = photoForm.querySelector('input[type="file"]').files[0];
    if (!file) throw new Error('Choose a photo first.');
    const { user: updated } = await uploadAvatar(file);
    photoForm.reset();
    showPhoto(updated);
    showMessage(photoForm, 'Photo updated!', 'success');
  });

  const removeButton = document.querySelector('#remove-photo');
  removeButton.addEventListener('click', async () => {
    removeButton.disabled = true;
    try {
      showPhoto((await removeAvatar()).user);
      showMessage(photoForm, 'Photo removed.', 'success');
    } catch (error) {
      showMessage(photoForm, error.message);
    } finally {
      removeButton.disabled = false;
    }
  });
}

// ---------- Bio and theme ----------

function renderThemeChoices(currentTheme) {
  const choices = THEMES.map((theme) => {
    const label = el('label', 'label-choice');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'theme';
    radio.value = theme.id;
    radio.checked = theme.id === currentTheme;
    label.append(radio, theme.name);
    return label;
  });
  document.querySelector('#theme-choices').replaceChildren(...choices);
}

function setUpProfile(user) {
  const bio = profileForm.querySelector('#bio');
  bio.value = user.bio;
  renderThemeChoices(user.theme);

  onSubmit(profileForm, async (values) => {
    await updateMe(values);
    showMessage(profileForm, 'Saved! ', 'success');
    const link = el('a', '', 'See your profile');
    link.href = `profile.html?handle=${user.handle}`;
    profileForm.querySelector('.form-message').append(link);
  });
}

// ---------- Moderators (admin only) ----------

async function showModerators() {
  const list = document.querySelector('#moderator-list');
  let moderators;
  try {
    ({ moderators } = await getModerators());
  } catch (error) {
    showMessage(moderatorForm, error.message);
    return;
  }

  if (moderators.length === 0) {
    list.replaceChildren(el('li', 'field-hint', 'No moderators yet.'));
    return;
  }

  list.replaceChildren(
    ...moderators.map((moderator) => {
      const item = el('li', 'moderator');
      const remove = el('button', 'action-button action-button--danger', 'Remove');
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try {
          await removeModerator(moderator.handle);
          await showModerators();
        } catch (error) {
          showMessage(moderatorForm, error.message);
          remove.disabled = false;
        }
      });
      item.append(renderAvatar(moderator), `@${moderator.handle}`, remove);
      return item;
    }),
  );
}

function setUpModerators() {
  document.querySelector('#moderators').hidden = false;
  onSubmit(moderatorForm, async ({ handle }) => {
    await addModerator(handle.replace('@', '').trim());
    moderatorForm.reset();
    await showModerators();
  });
  showModerators();
}

// ---------- Start ----------

const user = await loadSession();
if (!user) {
  window.location.href = 'login.html?next=settings.html';
} else {
  document.querySelector('#settings').hidden = false;
  setUpPhoto(user);
  setUpProfile(user);
  if (user.role === 'ADMIN') {
    setUpModerators();
  }
}
