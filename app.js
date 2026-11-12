// Vercel looks for the Express app in a file called app.js at the top of the project.
// Ours lives in server/app.js, so this file just points there. Locally, use `npm run dev`.
export { default } from './server/app.js';
