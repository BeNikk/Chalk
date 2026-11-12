// The ♥ button on every post, and the number next to it that shows who liked it.

import { getLikers, likePost, unlikePost } from './api.js';
import { openPeopleList } from './people.js';
import { goToLogin } from './session.js';

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

  count.addEventListener('click', () => openPeopleList('Liked by', () => getLikers(post.id), 'No likes yet.'));

  heart.addEventListener('click', async () => {
    if (!user) return goToLogin();

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
