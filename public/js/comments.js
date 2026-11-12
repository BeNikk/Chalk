// The comments section under a post: the list, the comment box, and delete buttons.

import { addComment, deleteComment, getComments } from './api.js';
import { onSubmit } from './forms.js';
import { el, renderComment } from './render.js';
import { canDelete } from './session.js';

const section = document.querySelector('#comments');
const list = document.querySelector('#comment-list');
const form = document.querySelector('#comment-form');
const loginNote = document.querySelector('#comment-login');

let commentCount = 0;

function showEmptyNote() {
  if (commentCount === 0) {
    list.replaceChildren(el('p', 'field-hint', 'No comments yet. Say something nice!'));
  }
}

function addToList(comment, user, onCountChange) {
  if (commentCount === 0) list.replaceChildren(); // remove the "no comments yet" note
  const item = renderComment(comment);

  if (canDelete(comment.author.handle, user)) {
    const button = el('button', 'action-button action-button--danger', 'Delete');
    button.addEventListener('click', async () => {
      if (!confirm('Delete this comment?')) return;
      button.disabled = true;
      try {
        await deleteComment(comment.id);
        item.remove();
        commentCount -= 1;
        onCountChange(commentCount);
        showEmptyNote();
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    });
    item.querySelector('.post-meta').append(button);
  }

  list.append(item);
  commentCount += 1;
}

// `onCountChange(count)` lets the post card above keep its 💬 number up to date.
export async function setUpComments(postId, user, onCountChange) {
  section.hidden = false;

  try {
    const { comments } = await getComments(postId);
    for (const comment of comments) {
      addToList(comment, user, onCountChange);
    }
    showEmptyNote();
  } catch (error) {
    list.replaceChildren(el('p', 'form-message form-message--error', error.message));
    return;
  }

  // The comment box appears only after the list has loaded, so a new comment can't show up twice.
  if (user) {
    form.hidden = false;
    onSubmit(form, async ({ body }) => {
      const { comment } = await addComment(postId, body);
      form.reset();
      addToList(comment, user, onCountChange);
      onCountChange(commentCount);
    });
  } else {
    loginNote.hidden = false;
    loginNote.querySelector('a').href = `login.html?next=${encodeURIComponent(`post.html?id=${postId}`)}`;
  }
}
