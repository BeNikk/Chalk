// The backend: builds the Express app that answers every request.
// It's started by index.js on your laptop, and imported directly by Vercel in production.
// New to Express? See docs/help/express.md

import { readFileSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import config from './config.js';
import { sessionMiddleware } from './session.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import { UPLOADS_FOLDER } from './services/photos.js';

const app = express();

// On Vercel, requests reach us through a proxy. This lets secure cookies and rate limits
// see the visitor's real connection instead of the proxy's.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json());

// Serves the website from public/, so locally the site and the API share one address.
const websiteFolder = path.join(import.meta.dirname, '..', 'public');
app.use(express.static(websiteFolder));

// Profile photos saved on this computer (only when there's no Cloudinary, i.e. not on the live site).
if (!config.isProduction) {
  app.use('/uploads', express.static(UPLOADS_FOLDER));
}

// Only API requests need to know who's logged in.
app.use('/api', sessionMiddleware);

// "Is the server alive?" Used by CI and after deploying.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// On Vercel, website files are served by Vercel itself, which doesn't turn "/" into index.html.
// So "/" reaches us there, and we send the browser on to the home page.
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Browsers ask for /favicon.ico by habit. Ours is an SVG.
app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/favicon.svg');
});

// Must come after all routes: any /api path nothing above matched gets a JSON 404.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Any other address that isn't a file in public/ gets the friendly "Page not found" page.
// Read once at start-up. Written with `new URL(…, import.meta.url)` so Vercel sees the file is
// needed and includes it with the server.
const notFoundPage = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
app.use((req, res) => {
  res.status(404).type('html').send(notFoundPage);
});

app.use(errorHandler);

export default app;
