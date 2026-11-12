// Every request from the website to the backend goes through this file.
// Each function matches one API address, so you can see the whole API in one place.
// New to fetch? See docs/help/fetch.md

// Sends one request and returns the JSON answer. If the server says no (status 400 or more),
// it throws an error carrying the server's message, so pages can show it.
async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body instanceof FormData) {
    options.body = body; // a file upload: the browser sets the right Content-Type itself
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new Error('Could not reach the server. Check your internet connection and try again.');
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.code = data.code;
    error.fields = data.fields;
    throw error;
  }
  return data;
}

// ---------- Accounts ----------

export function signUp({ email, password, handle }) {
  return request('POST', '/auth/signup', { email, password, handle });
}

export function verifyEmail(token) {
  return request('POST', '/auth/verify', { token });
}

export function resendVerification(email) {
  return request('POST', '/auth/resend-verification', { email });
}

export function logIn({ email, password }) {
  return request('POST', '/auth/login', { email, password });
}

export function logOut() {
  return request('POST', '/auth/logout');
}

export function forgotPassword(email) {
  return request('POST', '/auth/forgot-password', { email });
}

export function resetPassword({ token, password }) {
  return request('POST', '/auth/reset-password', { token, password });
}

// Returns the logged-in user, or null if nobody is logged in (or the server can't be reached).
export async function getMe() {
  try {
    const { user } = await request('GET', '/me');
    return user;
  } catch {
    return null;
  }
}

// ---------- Posts and likes ----------

// All optional: getPosts({ label: 'rant', before: 42 }), or getPosts({ following: true }).
export function getPosts({ label, before, following } = {}) {
  const params = new URLSearchParams();
  if (label) params.set('label', label);
  if (following) params.set('following', 'true');
  if (before) params.set('before', before);
  return request('GET', `/posts?${params}`);
}

export function getPost(id) {
  return request('GET', `/posts/${id}`);
}

export function createPost({ label, title, body }) {
  return request('POST', '/posts', { label, title, body });
}

export function deletePost(id) {
  return request('DELETE', `/posts/${id}`);
}

export function likePost(id) {
  return request('PUT', `/posts/${id}/like`);
}

export function unlikePost(id) {
  return request('DELETE', `/posts/${id}/like`);
}

export function getLikers(id) {
  return request('GET', `/posts/${id}/likes`);
}

// ---------- Comments ----------

export function getComments(postId) {
  return request('GET', `/posts/${postId}/comments`);
}

export function addComment(postId, body) {
  return request('POST', `/posts/${postId}/comments`, { body });
}

export function deleteComment(id) {
  return request('DELETE', `/comments/${id}`);
}

// ---------- Profiles and settings ----------

// encodeURIComponent keeps a strange handle (like "../me") from changing which address we ask for.
export function getProfile(handle) {
  return request('GET', `/users/${encodeURIComponent(handle)}`);
}

export function getUserPosts(handle, before) {
  const query = before ? `?before=${before}` : '';
  return request('GET', `/users/${encodeURIComponent(handle)}/posts${query}`);
}

export function followUser(handle) {
  return request('PUT', `/users/${encodeURIComponent(handle)}/follow`);
}

export function unfollowUser(handle) {
  return request('DELETE', `/users/${encodeURIComponent(handle)}/follow`);
}

export function getFollowers(handle) {
  return request('GET', `/users/${encodeURIComponent(handle)}/followers`);
}

export function getFollowing(handle) {
  return request('GET', `/users/${encodeURIComponent(handle)}/following`);
}

export function updateMe({ bio, theme }) {
  return request('PATCH', '/me', { bio, theme });
}

export function uploadAvatar(file) {
  const form = new FormData();
  form.append('photo', file);
  return request('PUT', '/me/avatar', form);
}

export function removeAvatar() {
  return request('DELETE', '/me/avatar');
}

// ---------- Admin ----------

export function getModerators() {
  return request('GET', '/admin/moderators');
}

export function addModerator(handle) {
  return request('PUT', `/admin/moderators/${encodeURIComponent(handle)}`);
}

export function removeModerator(handle) {
  return request('DELETE', `/admin/moderators/${encodeURIComponent(handle)}`);
}
