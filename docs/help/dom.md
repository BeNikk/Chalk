# Building the page with JavaScript (the DOM)

## What the DOM is

When the browser loads an HTML page, it turns it into a tree of objects you can change from JavaScript: the **DOM** (Document Object Model). Change the DOM, and the page on screen changes.

Chalk's feed starts as an empty `<div id="posts">`. JavaScript asks the API for posts, then builds a card for each one and adds it to that div.

## Making elements

```js
const p = document.createElement('p'); // a new, empty <p>
p.className = 'post-body';             // <p class="post-body">
p.textContent = post.body;             // the text inside it
list.append(p);                        // put it on the page
```

`client/js/render.js` has a tiny helper so this fits on one line:

```js
const p = el('p', 'post-body', post.body);
```

## Always `textContent`, never `innerHTML` for people's words

`innerHTML` treats text as HTML. If someone wrote a post containing

```html
<img src=x onerror="stealCookies()">
```

and we did `card.innerHTML = post.body`, that code would run for **everyone who opens the feed**. This is called **XSS** (cross-site scripting), and it's one of the most common security bugs on the web.

```js
card.textContent = post.body; // safe: shown as plain text
```

`textContent` always shows text as plain text, so the post above would just appear as those characters. Chalk only ever uses `textContent` for things people wrote.

## Finding elements and reacting to clicks

```js
const button = document.querySelector('#load-more');
button.addEventListener('click', loadPosts);
```

- `querySelector('#id')` / `querySelector('.class')` finds the first match; `querySelectorAll` finds all of them.
- `addEventListener('click', fn)` runs `fn` every time it's clicked.
- `element.hidden = true` hides it; `element.dataset.label` reads `data-label="…"`.

## Learn more

- [Introduction to the DOM (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [Manipulating documents (MDN)](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting)
- [Cross-site scripting (OWASP)](https://owasp.org/www-community/attacks/xss/)
