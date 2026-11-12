// Runs on Vercel before each deploy (see vercel.json). Not needed on your laptop.
// See docs/DEPLOYING.md

import { execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';

// 1. Bring the live database's tables up to date with prisma/migrations.
//    Only for the real site: a preview of someone's pull request must never change the live database.
if (process.env.VERCEL_ENV === 'production' && process.env.DIRECT_URL) {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('Not a production deploy with DIRECT_URL set, so the database was not updated.');
}

// 2. On Vercel, website files are served from a folder called public/, not by Express.
//    Ours live in client/, so copy them there.
rmSync('public', { recursive: true, force: true });
cpSync('client', 'public', { recursive: true });
console.log('Copied client/ to public/ for Vercel.');
