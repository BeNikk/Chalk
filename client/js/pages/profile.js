// profile.html?handle=inkyfox: someone's photo, bio and posts, dressed in their chosen theme.

import { getProfile, getUserPosts } from '../api.js';
import { getUrlParam } from '../forms.js';
import { el, joinedDate, renderAvatar, renderEmptyState, renderPostCard } from '../render.js';
import { loadSession } from '../session.js';
import { applyTheme } from '../themes.js';

const header = document.querySelector('#profile-header');
const list = document.querySelector('#posts');
const loadMoreButton = document.querySelector('#load-more');
const handle = getUrlParam('handle') || '';

let oldestPostId = null;

function renderHeader(profile, user) {
  const details = el('div', 'profile-details');
  details.append(el('h1', '', `@${profile.handle}`));
  if (profile.role !== 'USER') {
    details.append(el('span', 'badge', profile.role === 'ADMIN' ? 'Admin' : 'Moderator'));
  }
  if (profile.bio) {
    details.append(el('p', 'lead', profile.bio));
  }
  details.append(el('p', 'field-hint', joinedDate(profile.joinedAt)));

  if (user?.handle === profile.handle) {
    const edit = el('a', 'button button--small', 'Edit profile');
    edit.href = 'settings.html';
    details.append(edit);
  }

  header.replaceChildren(renderAvatar(profile, 'large'), details);
}

async function loadPosts(user) {
  loadMoreButton.disabled = true;
  try {
    const { posts } = await getUserPosts(handle, oldestPostId);
    for (const post of posts) {
      list.append(renderPostCard(post, user));
    }
    if (posts.length > 0) {
      oldestPostId = posts.at(-1).id;
    } else if (oldestPostId === null) {
      list.append(renderEmptyState('No posts yet.', 'coffee'));
    }
    loadMoreButton.hidden = posts.length < 20;
  } catch (error) {
    list.append(el('p', 'form-message form-message--error', error.message));
  } finally {
    loadMoreButton.disabled = false;
  }
}

async function showProfile(user) {
  try {
    const { user: profile } = await getProfile(handle);
    document.title = `@${profile.handle} · Chalk`;
    applyTheme(profile.theme);
    renderHeader(profile, user);
    loadMoreButton.addEventListener('click', () => loadPosts(user));
    await loadPosts(user);
  } catch (error) {
    header.replaceChildren(renderEmptyState(error.message, 'explainer'));
  }
}

const user = await loadSession();
showProfile(user);
