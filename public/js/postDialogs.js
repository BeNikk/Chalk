// Modal dialogs for editing and deleting posts.

import { deletePost, updatePost } from './api.js';
import { el } from './dom.js';
import { showToast } from './toast.js';

const LABELS = ['rant', 'poetry', 'mess', 'music', 'fixit'];

// ---------- Edit Post Dialog ----------

let editDialog;
let editForm;
let editMessage;
let editTitleInput;
let editBodyInput;
let editBodyCount;
let editSaveButton;
let editCancelButton;
let currentPost = null;
let currentOnSave = null;

function clearEditErrors() {
  editMessage.textContent = '';
  editMessage.className = 'form-message';
  for (const slot of editForm.querySelectorAll('.field-error')) {
    slot.textContent = '';
  }
}

function showEditErrors(error) {
  editMessage.textContent = error.message || 'Could not save changes.';
  editMessage.className = 'form-message form-message--error';
  if (error.fields) {
    for (const [name, messages] of Object.entries(error.fields)) {
      const slot = editForm.querySelector(`[data-error-for="${name}"]`);
      if (slot && messages?.[0]) slot.textContent = messages[0];
    }
  }
}

function updateBodyCounter() {
  editBodyCount.textContent = `${editBodyInput.value.length} / 5000`;
}

function createEditDialog() {
  editDialog = el('dialog', 'dialog dialog--wide');
  editDialog.setAttribute('aria-labelledby', 'edit-post-title');

  const box = el('div', 'dialog-box');
  const header = el('div', 'dialog-header');
  const heading = el('h2', '', 'Edit post');
  heading.id = 'edit-post-title';
  const closeButton = el('button', 'action-button', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', () => editDialog.close());
  header.append(heading, closeButton);

  editForm = el('form', 'form dialog-form');
  editMessage = el('p', 'form-message');
  editMessage.setAttribute('role', 'alert');

  // Label radio chips
  const fieldset = el('fieldset', 'field');
  fieldset.append(el('legend', '', 'Label'));
  const choices = el('div', 'label-choices');
  for (const label of LABELS) {
    const chip = el('label', 'label-choice');
    chip.dataset.label = label;
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'label';
    radio.value = label;
    radio.required = true;
    chip.append(radio, `#${label}`);
    choices.append(chip);
  }
  const labelError = el('p', 'field-error');
  labelError.dataset.errorFor = 'label';
  fieldset.append(choices, labelError);

  // Title field
  const titleField = el('div', 'field');
  const titleLabel = el('label');
  titleLabel.htmlFor = 'edit-post-title-input';
  titleLabel.append('Title ', el('span', 'field-hint', '(optional)'));
  editTitleInput = el('input');
  editTitleInput.id = 'edit-post-title-input';
  editTitleInput.name = 'title';
  editTitleInput.type = 'text';
  editTitleInput.maxLength = 120;
  const titleError = el('p', 'field-error');
  titleError.dataset.errorFor = 'title';
  titleField.append(titleLabel, editTitleInput, titleError);

  // Body field
  const bodyField = el('div', 'field');
  const bodyLabel = el('label', '', 'Your post');
  bodyLabel.htmlFor = 'edit-post-body-input';
  editBodyInput = el('textarea');
  editBodyInput.id = 'edit-post-body-input';
  editBodyInput.name = 'body';
  editBodyInput.rows = 8;
  editBodyInput.maxLength = 5000;
  editBodyInput.required = true;
  editBodyInput.addEventListener('input', updateBodyCounter);
  editBodyCount = el('p', 'field-hint', '0 / 5000');
  const bodyError = el('p', 'field-error');
  bodyError.dataset.errorFor = 'body';
  bodyField.append(bodyLabel, editBodyInput, editBodyCount, bodyError);

  // Actions
  const actions = el('div', 'dialog-actions');
  editCancelButton = el('button', 'button', 'Cancel');
  editCancelButton.type = 'button';
  editCancelButton.addEventListener('click', () => editDialog.close());
  editSaveButton = el('button', 'button button--primary', 'Save Changes');
  editSaveButton.type = 'submit';
  actions.append(editCancelButton, editSaveButton);

  editForm.append(editMessage, fieldset, titleField, bodyField, actions);
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentPost) return;

    clearEditErrors();
    editSaveButton.disabled = true;
    editCancelButton.disabled = true;

    const formData = new FormData(editForm);
    const values = {
      label: formData.get('label'),
      title: formData.get('title'),
      body: formData.get('body'),
    };

    try {
      const { post } = await updatePost(currentPost.id, values);
      const onSave = currentOnSave;
      editDialog.close();
      if (onSave) onSave(post);
      showToast('Post updated.', 'success');
    } catch (error) {
      showEditErrors(error);
    } finally {
      editSaveButton.disabled = false;
      editCancelButton.disabled = false;
    }
  });

  box.append(header, editForm);
  editDialog.append(box);
  editDialog.addEventListener('click', (event) => {
    if (event.target === editDialog) editDialog.close();
  });
  document.body.append(editDialog);
}

export function openEditPostDialog(post, onSave) {
  if (!editDialog) createEditDialog();
  currentPost = post;
  currentOnSave = onSave;
  clearEditErrors();

  const radio = editForm.querySelector(`input[name="label"][value="${post.label}"]`);
  if (radio) radio.checked = true;
  editTitleInput.value = post.title || '';
  editBodyInput.value = post.body || '';
  updateBodyCounter();

  editDialog.showModal();
  editBodyInput.focus();
}

// ---------- Delete Confirmation Dialog ----------

let deleteDialog;
let deleteMessage;
let deleteError;
let deleteConfirmButton;
let deleteCancelButton;
let deleteTargetPost = null;
let deleteOnConfirm = null;

function createDeleteDialog() {
  deleteDialog = el('dialog', 'dialog');
  deleteDialog.setAttribute('aria-labelledby', 'delete-post-title');

  const box = el('div', 'dialog-box');
  const header = el('div', 'dialog-header');
  const heading = el('h2', '', 'Delete post?');
  heading.id = 'delete-post-title';
  const closeButton = el('button', 'action-button', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', () => deleteDialog.close());
  header.append(heading, closeButton);

  deleteMessage = el(
    'p',
    'muted',
    'This will permanently remove this post along with its likes, comments, and Glances. This cannot be undone.',
  );

  deleteError = el('p', 'form-message form-message--error');
  deleteError.setAttribute('role', 'alert');

  const actions = el('div', 'dialog-actions');
  deleteCancelButton = el('button', 'button', 'Cancel');
  deleteCancelButton.type = 'button';
  deleteCancelButton.addEventListener('click', () => deleteDialog.close());

  deleteConfirmButton = el('button', 'button button--danger', 'Delete');
  deleteConfirmButton.type = 'button';
  deleteConfirmButton.addEventListener('click', async () => {
    if (!deleteTargetPost) return;
    deleteError.textContent = '';
    deleteConfirmButton.disabled = true;
    deleteCancelButton.disabled = true;

    try {
      await deletePost(deleteTargetPost.id);
      const onConfirm = deleteOnConfirm;
      const deletedPost = deleteTargetPost;
      deleteDialog.close();
      if (onConfirm) onConfirm(deletedPost);
    } catch (error) {
      deleteError.textContent = error.message || 'Could not delete the post. Please try again.';
    } finally {
      deleteConfirmButton.disabled = false;
      deleteCancelButton.disabled = false;
    }
  });

  actions.append(deleteCancelButton, deleteConfirmButton);
  box.append(header, deleteMessage, deleteError, actions);
  deleteDialog.append(box);
  deleteDialog.addEventListener('click', (event) => {
    if (event.target === deleteDialog) deleteDialog.close();
  });
  document.body.append(deleteDialog);
}

export function openDeletePostDialog(post, onConfirm) {
  if (!deleteDialog) createDeleteDialog();
  deleteTargetPost = post;
  deleteOnConfirm = onConfirm;
  deleteError.textContent = '';
  deleteDialog.showModal();
  deleteCancelButton.focus();
}
