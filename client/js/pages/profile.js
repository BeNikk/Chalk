// profile.html?handle=inkyfox: someone's photo, bio and posts, dressed in their chosen theme.

import { followUser, getFollowers, getFollowing, getProfile, getUserPosts, unfollowUser } from '../api.js';
import { getUrlParam } from '../forms.js';
import { el, joinedDate, renderAvatar, renderEmptyState, renderPostCard } from '../render.js';
import { openPeopleList } from '../people.js';
import { goToLogin, loadSession } from '../session.js';
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

  details.append(renderFollowCounts(profile));

  if (user?.handle === profile.handle) {
    const edit = el('a', 'button button--small', 'Edit profile');
    edit.href = 'settings.html';
    details.append(edit);
  } else {
    details.append(renderFollowButton(profile, user));
  }

  header.replaceChildren(renderAvatar(profile, 'large'), details);
}

// "12 followers · 3 following". Each number opens the list of people.
function renderFollowCounts(profile) {
  const row = el('div', 'follow-counts');

  followerCountButton = el('button', 'follow-count');
  followerCountButton.type = 'button';
  showFollowerCount(profile.followerCount);
  followerCountButton.addEventListener('click', () =>
    openPeopleList('Followers', () => getFollowers(profile.handle), 'No followers yet.'),
  );

  const following = el('button', 'follow-count');
  following.type = 'button';
  following.append(el('strong', null, profile.followingCount), ' following');
  following.addEventListener('click', () =>
    openPeopleList('Following', () => getFollowing(profile.handle), 'Not following anyone yet.'),
  );

  row.append(followerCountButton, following);
  return row;
}

let followerCountButton;

function showFollowerCount(count) {
  followerCountButton.replaceChildren(el('strong', null, count), count === 1 ? ' follower' : ' followers');
}

function renderFollowButton(profile, user) {
  const button = el('button', 'button button--small');
  button.type = 'button';
  let followedByMe = profile.followedByMe;

  function show() {
    button.textContent = followedByMe ? 'Following' : 'Follow';
    button.classList.toggle('button--primary', !followedByMe);
    button.setAttribute('aria-pressed', String(followedByMe));
  }
  show();

  button.addEventListener('click', async () => {
    if (!user) return goToLogin();
    button.disabled = true;
    try {
      const result = followedByMe ? await unfollowUser(profile.handle) : await followUser(profile.handle);
      followedByMe = result.followedByMe;
      showFollowerCount(result.followerCount);
      show();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
    }
  });
  return button;
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
