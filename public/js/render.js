// Builds post cards and other pieces of the page from data the API sends back.
// Everything people wrote goes in with textContent, never innerHTML, so nobody can sneak code into a post.
// New to building HTML from JavaScript? See docs/help/dom.md

import { setUpLikeButtons } from './likes.js';
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

// "@inkyfox" with their avatar, linking to their profile.
function renderAuthor(author) {
  const link = el('a', 'post-author');
  link.href = `profile.html?handle=${author.handle}`;
  link.append(renderAvatar(author), `@${author.handle}`);
  return link;
}

function renderTime(dateString) {
  const time = el('time', 'post-time', timeAgo(dateString));
  time.dateTime = dateString;
  return time;
}

function renderMeta(post) {
  const meta = el('div', 'post-meta');
  meta.append(renderAuthor(post.author), renderLabelChip(post.label), renderTime(post.createdAt));
  return meta;
}

// A line icon from client/icons. aria-hidden: screen readers read the button's label instead.
function renderIcon(name) {
  const icon = el('span', `icon icon--${name}`);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

export function showCommentCount(link, count) {
  link.querySelector('.action-text').textContent = count;
  link.setAttribute('aria-label', `${count} comments`);
}

// An icon and a bit of text, like [💬 3]. Buttons get type="button" so they never submit a form.
function renderActionButton(tag, icon, className = '') {
  const button = el(tag, `action-button ${className}`);
  if (tag === 'button') button.type = 'button';
  button.append(renderIcon(icon), el('span', 'action-text'));
  return button;
}

function renderActions(post, user) {
  const actions = el('div', 'post-actions');

  // The heart likes the post; the number next to it shows who liked it.
  const likes = el('div', 'like-group');
  const heart = el('button', 'like-button');
  heart.type = 'button';
  heart.append(renderIcon('heart'));
  const count = el('button', 'like-count');
  count.type = 'button';
  likes.append(heart, count);
  setUpLikeButtons(heart, count, post, user);

  const comments = renderActionButton('a', 'comment', 'comment-link');
  comments.href = `post.html?id=${post.id}#comments`;
  showCommentCount(comments, post.commentCount);

  const shareButton = renderActionButton('button', 'share');
  setUpShareButton(shareButton, post);

  actions.append(likes, comments, shareButton);
  return actions;
}

// "Joined November 2026"
export function joinedDate(dateString) {
  const month = new Date(dateString).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return `Joined ${month}`;
}

// One post. In the feed (`full: false`) long posts are shortened and the card links to the post page.
export function renderPostCard(post, user, { full = false } = {}) {
  const card = el('article', full ? 'post-card post-card--full' : 'post-card');
  // Cards take turns through the pastel colors (by id, so a post keeps its color), so a feed
  // full of #rant isn't all pink. The label chip still shows the label's own color.
  card.dataset.color = post.id % 5;

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
  if (!full) card.append(renderReadMore(card, body));

  card.append(renderActions(post, user));
  return card;
}

// In the feed, long posts are cut after a few lines (see .post-body in components.css).
// This button shows the rest, but only appears when something was actually cut off.
function renderReadMore(card, body) {
  const button = el('button', 'read-more', 'Read more');
  button.type = 'button';
  button.hidden = true;

  // We can only measure the text once it's on the page, so a ResizeObserver tells us
  // when it gets its size (and again if the window is resized).
  const observer = new ResizeObserver(() => {
    if (card.classList.contains('is-expanded')) return;
    button.hidden = body.scrollHeight <= body.clientHeight; // nothing hidden, no button
  });
  observer.observe(body);

  button.addEventListener('click', () => {
    const expanded = card.classList.toggle('is-expanded');
    button.textContent = expanded ? 'Show less' : 'Read more';
  });
  return button;
}

function linkTo(href, content) {
  const a = el('a', 'post-link');
  a.href = href;
  a.append(content);
  return a;
}

export function renderComment(comment) {
  const item = el('article', 'comment');
  const meta = el('div', 'post-meta');
  meta.append(renderAuthor(comment.author), renderTime(comment.createdAt));
  item.append(meta, el('p', 'comment-body', comment.body));
  return item;
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
