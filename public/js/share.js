// The Share button: opens the phone's share sheet, or copies the link on a laptop.

function postLink(post) {
  return new URL(`post.html?id=${post.id}`, window.location.href).href;
}

// Shows a short message on the button, then puts the word back.
function flash(text, message) {
  text.textContent = message;
  setTimeout(() => (text.textContent = 'Share'), 2000);
}

export function setUpShareButton(button, post) {
  const text = button.querySelector('.action-text');
  text.textContent = 'Share';

  button.addEventListener('click', async () => {
    const url = postLink(post);

    // navigator.share exists on most phones; it opens WhatsApp, Instagram and friends.
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title || `A #${post.label} on Chalk`, url });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return; // the person closed the share sheet
        // Anything else: fall back to copying the link below.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      flash(text, 'Link copied!');
    } catch {
      prompt('Copy this link:', url);
    }
  });
}
