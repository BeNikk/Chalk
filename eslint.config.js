// Rules for `npm run lint`, which checks the code for common mistakes.
// CI runs it on every pull request, so run it yourself before you push.

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,

  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['client/**/*.js'],
    languageOptions: { globals: globals.browser },
  },

  {
    rules: {
      // `===` instead of `==`, because `==` quietly converts types ("1" == 1 is true).
      eqeqeq: 'error',
    },
  },
];
