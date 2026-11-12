// `npm test`: prepares the test database, then runs every file in tests/.
// New to tests? See docs/help/testing.md

import { execSync } from 'node:child_process';

// Settings from .env.test. In CI they're already set, and already-set values win.
process.loadEnvFile('.env.test');

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

// Make sure the test database has the latest tables.
run('npx prisma migrate deploy');

// One file at a time, because every test file shares the same test database.
// --test-force-exit stops the run once tests finish, even though the database connection is still open.
run('node --test --test-concurrency=1 --test-force-exit "tests/**/*.test.js"');
