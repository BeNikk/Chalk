// feed.html: everyone's posts, newest first, with a label filter and "Load more".

import { getPosts } from '../api.js';
import { getUrlParam } from '../forms.js';
import { renderEmptyState, renderPostCard } from '../render.js';
import { loadSession } from '../session.js';

const list = document.querySelector('#posts');
const loadMoreButton = document.querySelector('#load-more');
const errorMessage = document.querySelector('#feed-error');
const filterButtons = document.querySelectorAll('.label-filter button');
const labelNotes = document.querySelectorAll('.label-note');

// The filters: '' (everything), 'following' (people you follow), or one of the labels.
const labels = [...filterButtons].map((button) => button.dataset.label);

let user = null;
let label = labels.includes(getUrlParam('label')) ? getUrlParam('label') : '';
let oldestPostId = null;
// Goes up every time the list starts again, so answers to older requests can be ignored.
let listVersion = 0;

function showActiveFilter() {
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.label === label));
  }
  for (const note of labelNotes) {
    note.setAttribute('aria-current', String(note.dataset.label === label));
  }
}

// Adds the next 20 posts to the bottom of the list.
async function loadPosts() {
  const versionAtStart = listVersion;
  loadMoreButton.disabled = true;
  errorMessage.textContent = '';
  try {
    const following = label === 'following';
    const { posts } = await getPosts({
      label: following ? '' : label,
      following,
      before: oldestPostId,
    });
    if (versionAtStart !== listVersion) return; // a different label was picked while we waited

    for (const post of posts) {
      list.append(renderPostCard(post, user));
    }
    if (posts.length > 0) {
      oldestPostId = posts.at(-1).id;
    } else if (oldestPostId === null) {
      const message =
        label === 'following'
          ? 'Nothing from people you follow yet. Open someone’s profile and tap Follow.'
          : 'Nothing here yet. Be the first to write something!';
      list.append(renderEmptyState(message));
      loadMoreButton.hidden = true;
      return;
    }

    // A short page means there's nothing older.
    const reachedTheEnd = posts.length < 20;
    loadMoreButton.hidden = reachedTheEnd;
    if (reachedTheEnd) list.append(renderEmptyState("You're all caught up!", 'coffee'));
  } catch (error) {
    errorMessage.textContent = error.message;
  } finally {
    loadMoreButton.disabled = false;
  }
}

// Picking a label starts the list again, and puts the label in the address so it can be shared.
function chooseLabel(newLabel) {
  label = newLabel;
  oldestPostId = null;
  listVersion += 1;
  list.replaceChildren();
  showActiveFilter();
  history.replaceState(null, '', label ? `feed.html?label=${label}` : 'feed.html');
  loadPosts();
}

for (const button of filterButtons) {
  button.addEventListener('click', () => chooseLabel(button.dataset.label));
}
// The sticky notes in the sidebar are links, so they work without JavaScript too; this just skips the reload.
for (const note of labelNotes) {
  note.addEventListener('click', (event) => {
    event.preventDefault();
    chooseLabel(note.dataset.label);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
loadMoreButton.addEventListener('click', loadPosts);

user = await loadSession();
if (user) {
  document.querySelector('#greeting').textContent = `Hi @${user.handle}, here's what campus is writing.`;
  document.querySelector('.label-filter [data-label="following"]').hidden = false;
} else if (label === 'following') {
  label = ''; // only logged-in people follow anyone
}
showActiveFilter();
loadPosts();
