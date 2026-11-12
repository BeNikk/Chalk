// The backend: builds the Express app that answers every request.
// It's started by index.js on your laptop, and imported directly by Vercel in production.
// New to Express? See docs/help/express.md

import path from 'node:path';
import express from 'express';
import config from './config.js';
import { sessionMiddleware } from './session.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import postRoutes from './routes/posts.js';

const app = express();

// On Vercel, requests reach us through a proxy. This lets secure cookies and rate limits
// see the visitor's real connection instead of the proxy's.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json());

// Serves the website from client/, so locally the site and the API share one address.
const clientFolder = path.join(import.meta.dirname, '..', 'client');
app.use(express.static(clientFolder));

// Only API requests need to know who's logged in.
app.use('/api', sessionMiddleware);

// "Is the server alive?" Used by CI and after deploying.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/posts', postRoutes);

// Must come after all routes: any /api path nothing above matched gets a JSON 404.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

export default app;
