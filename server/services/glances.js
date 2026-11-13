// Anonymous reader identification for Glances, using signed HttpOnly cookies and one-way hashes.
// Never stores raw IP addresses or user-agent strings in the database.

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import config from '../config.js';

const COOKIE_NAME = 'chalk.reader';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function hmac(value) {
  return createHmac('sha256', config.sessionSecret).update(value).digest('hex');
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function verifyVisitorToken(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(id);
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  return id;
}

function setVisitorCookie(res, visitorId) {
  res.cookie(COOKIE_NAME, `${visitorId}.${hmac(visitorId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: ONE_YEAR_MS,
  });
}

// Ensures logged-out visitors receive a stable signed reader cookie when opening a post.
export function ensureVisitorCookie(req, res) {
  if (req.user) return null;
  const existing = verifyVisitorToken(readCookie(req, COOKIE_NAME));
  if (existing) return existing;
  const visitorId = randomUUID();
  setVisitorCookie(res, visitorId);
  return visitorId;
}

export function getReaderIdentity(req, res) {
  if (req.user) {
    return { userId: req.user.id, readerKey: `u:${req.user.id}` };
  }

  const existing = verifyVisitorToken(readCookie(req, COOKIE_NAME));
  if (existing) {
    return { userId: null, readerKey: `a:${hmac(`cookie:${existing}`)}` };
  }

  // Cookieless client (e.g. script without cookie jar): set a cookie for future calls,
  // and deduplicate this request using a one-way salted hash of IP + User-Agent.
  const visitorId = randomUUID();
  setVisitorCookie(res, visitorId);
  const fallback = `${req.ip || 'unknown'}|${req.get('user-agent') || ''}`;
  return { userId: null, readerKey: `a:${hmac(`anon:${fallback}`)}` };
}
