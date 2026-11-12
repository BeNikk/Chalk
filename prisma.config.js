// Settings for the Prisma commands (`npx prisma ...`): where the schema and migrations live,
// which database to change, and how to fill it with fake data.
// New to Prisma? See docs/help/prisma.md

import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma doesn't read .env by itself, so load it here (on your laptop only;
// on the live site and in CI the settings come from the hosting dashboard).
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Creating and changing tables needs the direct connection, not Supabase's pooled one.
    // The `?? ''` lets `prisma generate` run where no database is set, like a fresh CI machine.
    url: process.env.DIRECT_URL ?? '',
  },
});
