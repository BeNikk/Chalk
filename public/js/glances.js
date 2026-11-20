// Glances: post reading analytics display and genuine-read engagement tracking.

import { recordGlance } from './api.js';
import { el } from './dom.js';

let dialog;
let uniqueCountEl;
let totalCountEl;

function createGlancesDialog() {
  dialog = el('dialog', 'dialog');
  dialog.setAttribute('aria-labelledby', 'glances-title');

  const box = el('div', 'dialog-box');
  const header = el('div', 'dialog-header');
  const title = el('h2', '', 'Glances');
  title.id = 'glances-title';
  const closeButton = el('button', 'action-button', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', () => dialog.close());
  header.append(title, closeButton);

  const stats = el('div', 'glance-stats');

  const uniqueCard = el('div', 'glance-stat-box');
  uniqueCountEl = el('strong', 'glance-stat-value', '0');
  uniqueCard.append(uniqueCountEl, el('span', 'field-hint', 'Unique readers'));

  const totalCard = el('div', 'glance-stat-box');
  totalCountEl = el('strong', 'glance-stat-value', '0');
  totalCard.append(totalCountEl, el('span', 'field-hint', 'Total reads'));

  stats.append(uniqueCard, totalCard);

  const note = el(
    'p',
    'field-hint glance-note',
    'Glances count people who opened and stayed to read this post. Author views and rapid reloads are excluded.',
  );

  box.append(header, stats, note);
  dialog.append(box);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);
}

export function openGlancesBreakdown(glanceCount, totalGlances) {
  if (!dialog) createGlancesDialog();
  uniqueCountEl.textContent = String(glanceCount);
  totalCountEl.textContent = String(totalGlances);
  dialog.showModal();
}

export function showGlanceCount(button, glanceCount = 0, totalGlances = 0) {
  const unique = Number(glanceCount) || 0;
  const total = Number(totalGlances) || 0;
  button.dataset.glanceCount = String(unique);
  button.dataset.totalGlances = String(total);
  button.querySelector('.action-text').textContent = String(unique);

  const readerWord = unique === 1 ? 'reader' : 'readers';
  const readWord = total === 1 ? 'read' : 'reads';
  const summary = `${unique} unique ${readerWord} · ${total} total ${readWord}`;
  button.title = summary;
  button.setAttribute('aria-label', `Glances: ${summary}`);
}

// Tracks genuine active reading time on the single-post page before recording a Glance.
// Never counts when the author views their own post or when a tab/card is hidden.
export function trackPostGlance(post, card, user, onUpdate) {
  if (user && post.author.handle === user.handle) {
    return () => {};
  }

  const words = post.body.trim().split(/\s+/).filter(Boolean).length;
  const thresholdMs = Math.min(6000, Math.max(3000, words * 120));

  let activeMs = 0;
  let lastTick = null;
  let isVisibleInViewport = true;
  let sent = false;

  function isActivelyReading() {
    return document.visibilityState === 'visible' && isVisibleInViewport;
  }

  function updateClock() {
    const now = performance.now();
    if (lastTick !== null && isActivelyReading()) {
      activeMs += now - lastTick;
    }
    lastTick = isActivelyReading() ? now : null;
  }

  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        isVisibleInViewport = entries.some((entry) => entry.isIntersecting);
        updateClock();
      },
      { threshold: 0.2 },
    );
    observer.observe(card);
  }

  function onVisibilityChange() {
    updateClock();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  const timer = setInterval(async () => {
    if (sent) return;
    updateClock();
    if (activeMs < thresholdMs) return;

    sent = true;
    cleanup();
    try {
      const result = await recordGlance(post.id, Math.round(activeMs));
      if (typeof result.glanceCount === 'number') {
        onUpdate(result.glanceCount, result.totalGlances);
      }
    } catch {
      // Analytics failures should never interrupt reading.
    }
  }, 250);

  function cleanup() {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (observer) observer.disconnect();
  }

  updateClock();
  return cleanup;
}
