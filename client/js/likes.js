// The ♥ button on every post.

import { likePost, unlikePost } from './api.js';

function showLikes(button, likedByMe, likeCount) {
  button.textContent = `${likedByMe ? '♥' : '♡'} ${likeCount}`;
  button.setAttribute('aria-pressed', String(likedByMe));
  button.setAttribute('aria-label', `Like, ${likeCount} likes`);
}

export function setUpLikeButton(button, post, user) {
  let { likedByMe, likeCount } = post;
  showLikes(button, likedByMe, likeCount);

  button.addEventListener('click', async () => {
    if (!user) {
      // Come back to this page after logging in.
      const page = window.location.pathname.split('/').pop() + window.location.search;
      window.location.href = `login.html?next=${encodeURIComponent(page)}`;
      return;
    }

    button.disabled = true;
    try {
      const result = likedByMe ? await unlikePost(post.id) : await likePost(post.id);
      likedByMe = result.likedByMe;
      likeCount = result.likeCount;
      showLikes(button, likedByMe, likeCount);
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
    }
  });
}
