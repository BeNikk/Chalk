// Starts the server on your laptop (`npm run dev`).
// On Vercel this file isn't used: Vercel imports the app from app.js and runs it itself.

import app from './app.js';
import config from './config.js';

app.listen(config.port, () => {
  console.log(`Chalk is running at ${config.appUrl}`);
});
