// Builds post cards and other pieces of the page from data the API sends back.
// Everything people wrote goes in with textContent, never innerHTML, so nobody can sneak code into a post.
// New to building HTML from JavaScript? See docs/help/dom.md

import { el, renderIcon } from './dom.js';
import { openGlancesBreakdown, showGlanceCount } from './glances.js';
import { setUpLikeButtons } from './likes.js';
import { openDeletePostDialog, openEditPostDialog } from './postDialogs.js';
import { canDelete, canEdit } from './session.js';
import { setUpShareButton } from './share.js';

export { el };

function closeAllPostMenus(exceptMenu = null) {
  for (const menu of document.querySelectorAll('.post-menu')) {
    if (menu === exceptMenu) continue;
    const list = menu.querySelector('.post-menu-list');
    const button = menu.querySelector('.post-menu-button');
    if (list && !list.hidden) {
      list.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }
  }
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.post-menu')) {
    closeAllPostMenus();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAllPostMenus();
  }
});

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

function renderEditedBadge(editedAt) {
  const badge = el('span', 'post-edited', '(edited)');
  if (editedAt) {
    badge.title = `Edited ${new Date(editedAt).toLocaleString()}`;
  } else {
    badge.hidden = true;
  }
  return badge;
}

function renderPostMenu(post, user, { card, contentEl, metaEl, full, onEdit, onDelete }) {
  const allowEdit = canEdit(post.author.handle, user);
  const allowDelete = canDelete(post.author.handle, user);
  if (!allowEdit && !allowDelete) return null;

  const menu = el('div', 'post-menu');
  const button = el('button', 'post-menu-button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Post options');
  button.append(renderIcon('more'));

  const list = el('div', 'post-menu-list');
  list.setAttribute('role', 'menu');
  list.hidden = true;

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = list.hidden;
    closeAllPostMenus(menu);
    list.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  });

  if (allowEdit) {
    const editItem = el('button', 'post-menu-item');
    editItem.type = 'button';
    editItem.setAttribute('role', 'menuitem');
    editItem.append(renderIcon('edit'), 'Edit');
    editItem.addEventListener('click', () => {
      closeAllPostMenus();
      openEditPostDialog(post, (updated) => {
        Object.assign(post, updated);
        const chip = metaEl.querySelector('.label-chip');
        if (chip) {
          chip.dataset.label = updated.label;
          chip.textContent = `#${updated.label}`;
        }
        const editedBadge = metaEl.querySelector('.post-edited');
        if (editedBadge && updated.editedAt) {
          editedBadge.hidden = false;
          editedBadge.title = `Edited ${new Date(updated.editedAt).toLocaleString()}`;
        }
        card.classList.remove('is-expanded');
        renderPostContent(contentEl, post, full);
        if (onEdit) onEdit(post, card);
      });
    });
    list.append(editItem);
  }

  if (allowDelete) {
    const deleteItem = el('button', 'post-menu-item post-menu-item--danger');
    deleteItem.type = 'button';
    deleteItem.setAttribute('role', 'menuitem');
    deleteItem.append(renderIcon('trash'), 'Delete');
    deleteItem.addEventListener('click', () => {
      closeAllPostMenus();
      openDeletePostDialog(post, () => {
        if (onDelete) onDelete(post, card);
      });
    });
    list.append(deleteItem);
  }

  menu.append(button, list);
  return menu;
}

function renderMeta(post, user, menuContext) {
  const meta = el('div', 'post-meta');
  meta.append(
    renderAuthor(post.author),
    renderLabelChip(post.label),
    renderTime(post.createdAt),
    renderEditedBadge(post.editedAt),
  );
  const menu = renderPostMenu(post, user, { ...menuContext, metaEl: meta });
  if (menu) meta.append(menu);
  return meta;
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

  const glances = renderActionButton('button', 'eye', 'glance-button');
  showGlanceCount(glances, post.glanceCount, post.totalGlances);
  glances.addEventListener('click', () => {
    openGlancesBreakdown(Number(glances.dataset.glanceCount), Number(glances.dataset.totalGlances));
  });

  const shareButton = renderActionButton('button', 'share');
  setUpShareButton(shareButton, post);

  actions.append(likes, comments, glances, shareButton);
  return actions;
}

function renderPostContent(contentEl, post, full) {
  const link = `post.html?id=${post.id}`;
  const nodes = [];

  if (post.title) {
    const title = el('h2', 'post-title');
    title.append(full ? post.title : linkTo(link, post.title));
    nodes.push(title);
  }

  const body = el('p', 'post-body', post.body);
  nodes.push(full || post.title ? body : linkTo(link, body));

  if (!full) {
    const card = contentEl.closest('.post-card');
    nodes.push(renderReadMore(card, body));
  }

  contentEl.replaceChildren(...nodes);
}

// "Joined November 2026"
export function joinedDate(dateString) {
  const month = new Date(dateString).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return `Joined ${month}`;
}

// One post. In the feed (`full: false`) long posts are shortened and the card links to the post page.
export function renderPostCard(post, user, { full = false, onEdit, onDelete } = {}) {
  const card = el('article', full ? 'post-card post-card--full' : 'post-card');
  // Cards take turns through the pastel colors (by id, so a post keeps its color), so a feed
  // full of #rant isn't all pink. The label chip still shows the label's own color.
  card.dataset.color = post.id % 5;

  const contentEl = el('div', 'post-content');
  const metaEl = renderMeta(post, user, { card, contentEl, full, onEdit, onDelete });
  card.append(metaEl, contentEl);
  renderPostContent(contentEl, post, full);
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
    if (!card || card.classList.contains('is-expanded')) return;
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
