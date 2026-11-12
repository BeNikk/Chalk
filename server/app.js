// Builds the Express app: This is the backend => what happens to every request that reaches the server.
// This file only *creates* the app. Starting it is done by index.js on your laptop,
// and by Vercel in production, which is why the app is exported at the bottom.

import path from 'node:path';
import express from 'express';

const app = express();

// Lets route handlers read JSON sent by the browser as `req.body`.
app.use(express.json());

// Serves the website: index.html, css/, illustrations/ and so on.
// Locally this is how the site and the API share one address (http://localhost:3000).
const clientFolder = path.join(import.meta.dirname, '..', 'client');
app.use(express.static(clientFolder));

// A simple "is the server alive?" check, used by CI and when deploying.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Any /api address that didn't match a route above gets a JSON error,
// so other clients (a bot, a mobile app) always get JSON back from the API.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
