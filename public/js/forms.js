// Small helpers every form on the site uses: read the inputs, show errors and success
// messages, and stop double-clicks while a request is on its way.

export function readForm(form) {
  return Object.fromEntries(new FormData(form));
}

export function showMessage(form, text, type = 'error') {
  const message = form.querySelector('.form-message');
  message.textContent = text;
  message.className = `form-message form-message--${type}`;
}

// Puts each field's error under its input, e.g. <p class="field-error" data-error-for="email">.
function showFieldErrors(form, fields = {}) {
  for (const [name, messages] of Object.entries(fields)) {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) slot.textContent = messages[0];
  }
}

function clearMessages(form) {
  form.querySelector('.form-message').textContent = '';
  for (const slot of form.querySelectorAll('.field-error')) {
    slot.textContent = '';
  }
}

// Runs `handleValues(values)` when the form is submitted. Errors it throws are shown on the form.
export function onSubmit(form, handleValues) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // stay on the page instead of reloading it
    clearMessages(form);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    try {
      await handleValues(readForm(form));
    } catch (error) {
      showMessage(form, error.message);
      showFieldErrors(form, error.fields);
    } finally {
      button.disabled = false;
    }
  });
}

// Reads a value from the address bar, e.g. the token in verify.html?token=abc.
export function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
