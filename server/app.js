// The backend: builds the Express app that answers every request.
// It's started by index.js on your laptop, and imported directly by Vercel in production.
// New to Express? See docs/help/express.md

import path from 'node:path';
import express from 'express';

const app = express();

app.use(express.json());

// Serves the website from client/, so locally the site and the API share one address.
const clientFolder = path.join(import.meta.dirname, '..', 'client');
app.use(express.static(clientFolder));

// "Is the server alive?" Used by CI and after deploying.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Must stay last: any /api path nothing above matched gets a JSON 404.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
