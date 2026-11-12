// Runs on Vercel before each deploy (see vercel.json). Not needed on your laptop.
// The website in public/ needs no build: Vercel serves that folder as it is. See docs/DEPLOYING.md

import { execSync } from 'node:child_process';

// Bring the live database's tables up to date with prisma/migrations.
// Only for the real site: a preview of someone's pull request must never change the live database.
if (process.env.VERCEL_ENV === 'production' && process.env.DIRECT_URL) {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('Not a production deploy with DIRECT_URL set, so the database was not updated.');
}
