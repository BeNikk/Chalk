// Lightweight toast notifications for success and error feedback.

import { el } from './dom.js';

const PENDING_KEY = 'chalk.pendingToast';
let container;
let hideTimer;

function ensureContainer() {
  if (container) return container;
  container = el('div', 'toast-container');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');
  document.body.append(container);
  return container;
}

export function showToast(message, type = 'success') {
  const box = ensureContainer();
  clearTimeout(hideTimer);

  const toast = el('div', `toast toast--${type}`);
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());

  box.replaceChildren(toast);
  hideTimer = setTimeout(() => {
    toast.remove();
  }, 4000);
}

export function setPendingToast(message, type = 'success') {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, type }));
  } catch {
    // Ignore storage failures (e.g. private browsing restrictions).
  }
}

export function consumePendingToast() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw);
    if (parsed?.message) showToast(parsed.message, parsed.type || 'success');
  } catch {
    // Ignore invalid storage entries.
  }
}
