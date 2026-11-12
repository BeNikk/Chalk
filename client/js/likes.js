// The ♥ button on every post, and the number next to it that shows who liked it.

import { likePost, unlikePost } from './api.js';
import { openLikers } from './likers.js';

function showLikes(heart, count, likedByMe, likeCount) {
  heart.setAttribute('aria-pressed', String(likedByMe)); // the CSS fills the heart when pressed
  count.textContent = likeCount;
  count.disabled = likeCount === 0; // nobody to show yet
  count.setAttribute('aria-label', `See who liked this (${likeCount} likes)`);
}

export function setUpLikeButtons(heart, count, post, user) {
  let { likedByMe, likeCount } = post;
  heart.setAttribute('aria-label', 'Like');
  showLikes(heart, count, likedByMe, likeCount);

  count.addEventListener('click', () => openLikers(post.id));

  heart.addEventListener('click', async () => {
    if (!user) {
      // Come back to this page after logging in.
      const page = window.location.pathname.split('/').pop() + window.location.search;
      window.location.href = `login.html?next=${encodeURIComponent(page)}`;
      return;
    }

    heart.disabled = true;
    try {
      const result = likedByMe ? await unlikePost(post.id) : await likePost(post.id);
      likedByMe = result.likedByMe;
      likeCount = result.likeCount;
      showLikes(heart, count, likedByMe, likeCount);
    } catch (error) {
      alert(error.message);
    } finally {
      heart.disabled = false;
    }
  });
}
