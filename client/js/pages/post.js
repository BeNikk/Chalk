// post.html?id=7: one post on its own page, with its comments.

import { deletePost, getPost } from '../api.js';
import { getUrlParam } from '../forms.js';
import { el, renderEmptyState, renderPostCard, showCommentCount } from '../render.js';
import { canDelete, loadSession } from '../session.js';
import { setUpComments } from '../comments.js';

const container = document.querySelector('#post');

function renderDeleteButton(post) {
  const button = el('button', 'action-button action-button--danger', 'Delete');
  button.addEventListener('click', async () => {
    if (!confirm('Delete this post? This can’t be undone.')) return;
    button.disabled = true;
    try {
      await deletePost(post.id);
      window.location.href = 'feed.html';
    } catch (error) {
      alert(error.message);
      button.disabled = false;
    }
  });
  return button;
}

async function showPost(user) {
  const id = getUrlParam('id');
  if (!id) {
    container.replaceChildren(renderEmptyState('This post does not exist.', 'explainer'));
    return;
  }

  try {
    const { post } = await getPost(id);
    document.title = `${post.title || `#${post.label} by @${post.author.handle}`} · Chalk`;

    const card = renderPostCard(post, user, { full: true });
    if (canDelete(post.author.handle, user)) {
      card.querySelector('.post-actions').append(renderDeleteButton(post));
    }
    container.replaceChildren(card);

    const commentLink = card.querySelector('.comment-link');
    setUpComments(post.id, user, (count) => showCommentCount(commentLink, count));
  } catch (error) {
    container.replaceChildren(renderEmptyState(error.message, 'explainer'));
  }
}

const user = await loadSession();
showPost(user);
