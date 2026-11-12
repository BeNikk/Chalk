// Vercel runs the file called app.js at the top of the project, and only if it uses express itself.
// Our real app lives in server/app.js, so this wraps it in a tiny Express app. Locally, use `npm run dev`.
import express from 'express';
import chalk from './server/app.js';

const app = express();
app.use(chalk);

export default app;
