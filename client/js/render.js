// Builds post cards and other pieces of the page from data the API sends back.
// Everything people wrote goes in with textContent, never innerHTML, so nobody can sneak code into a post.
// New to building HTML from JavaScript? See docs/help/dom.md

import { setUpLikeButton } from './likes.js';
import { setUpShareButton } from './share.js';

// A small helper: el('p', 'post-body', 'Hello') makes <p class="post-body">Hello</p>.
export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// "just now", "5m", "3h", "2d", or a date for anything older than a week.
export function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 60 * 60) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 24 * 60 * 60) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 24 * 60 * 60) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateString).toLocaleDateString();
}

// The person's photo, or the first letter of their handle in a coloured circle.
export function renderAvatar(person, size = 'small') {
  if (person.avatarUrl) {
    const img = el('img', `avatar avatar--${size}`);
    img.src = person.avatarUrl;
    img.alt = '';
    return img;
  }
  return el('span', `avatar avatar--${size} avatar--letter`, person.handle[0].toUpperCase());
}

export function renderLabelChip(label) {
  const chip = el('span', 'label-chip', `#${label}`);
  chip.dataset.label = label;
  return chip;
}

function renderMeta(post) {
  const meta = el('div', 'post-meta');

  const author = el('a', 'post-author');
  author.href = `profile.html?handle=${post.author.handle}`;
  author.append(renderAvatar(post.author), `@${post.author.handle}`);

  const time = el('time', 'post-time', timeAgo(post.createdAt));
  time.dateTime = post.createdAt;

  meta.append(author, renderLabelChip(post.label), time);
  return meta;
}

function renderActions(post, user) {
  const actions = el('div', 'post-actions');

  const likeButton = el('button', 'action-button');
  setUpLikeButton(likeButton, post, user);

  const comments = el('a', 'action-button', `💬 ${post.commentCount}`);
  comments.href = `post.html?id=${post.id}#comments`;
  comments.setAttribute('aria-label', `${post.commentCount} comments`);

  const shareButton = el('button', 'action-button');
  setUpShareButton(shareButton, post);

  actions.append(likeButton, comments, shareButton);
  return actions;
}

// One post. In the feed (`full: false`) long posts are shortened and the card links to the post page.
export function renderPostCard(post, user, { full = false } = {}) {
  const card = el('article', full ? 'post-card post-card--full' : 'post-card');
  card.dataset.label = post.label;

  // In the feed, one link to the post: on the title, or on the body when there's no title.
  const link = `post.html?id=${post.id}`;
  card.append(renderMeta(post));

  if (post.title) {
    const title = el('h2', 'post-title');
    title.append(full ? post.title : linkTo(link, post.title));
    card.append(title);
  }

  const body = el('p', 'post-body', post.body);
  card.append(full || post.title ? body : linkTo(link, body));

  card.append(renderActions(post, user));
  return card;
}

function linkTo(href, content) {
  const a = el('a', 'post-link');
  a.href = href;
  a.append(content);
  return a;
}

// Shown when a list has nothing in it yet.
export function renderEmptyState(message, illustration = 'reader') {
  const box = el('div', 'empty-state');
  const img = el('img', 'illustration');
  img.src = `illustrations/${illustration}.svg`;
  img.alt = '';
  box.append(img, el('p', 'lead', message));
  return box;
}
