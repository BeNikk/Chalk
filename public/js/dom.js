// Tiny DOM helper shared across modules without circular imports.

export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function renderIcon(name) {
  const icon = el('span', `icon icon--${name}`);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}
