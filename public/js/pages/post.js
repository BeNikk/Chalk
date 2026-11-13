// post.html?id=7: one post on its own page, with its comments and reading analytics (Glances).

import { getPost } from '../api.js';
import { getUrlParam } from '../forms.js';
import { showGlanceCount, trackPostGlance } from '../glances.js';
import { renderEmptyState, renderPostCard, showCommentCount } from '../render.js';
import { loadSession } from '../session.js';
import { setPendingToast } from '../toast.js';
import { setUpComments } from '../comments.js';

const container = document.querySelector('#post');

function postPageTitle(post) {
  return `${post.title || `#${post.label} by @${post.author.handle}`} · Chalk`;
}

async function showPost(user) {
  const id = getUrlParam('id');
  if (!id) {
    container.replaceChildren(renderEmptyState('This post does not exist.', 'explainer'));
    return;
  }

  try {
    const { post } = await getPost(id);
    document.title = postPageTitle(post);

    const card = renderPostCard(post, user, {
      full: true,
      onEdit: (updated) => {
        document.title = postPageTitle(updated);
      },
      onDelete: () => {
        setPendingToast('Post deleted.', 'success');
        window.location.href = 'feed.html';
      },
    });
    container.replaceChildren(card);

    const glanceButton = card.querySelector('.glance-button');
    trackPostGlance(post, card, user, (glanceCount, totalGlances) => {
      showGlanceCount(glanceButton, glanceCount, totalGlances);
    });

    const commentLink = card.querySelector('.comment-link');
    setUpComments(post.id, user, (count) => showCommentCount(commentLink, count));
  } catch (error) {
    container.replaceChildren(renderEmptyState(error.message, 'explainer'));
  }
}

const user = await loadSession();
showPost(user);
