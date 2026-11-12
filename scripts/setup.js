// `npm run setup`: gets a fresh copy of Chalk ready to run on your laptop.
// Running it again resets your local data to the fake data.

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function createEnvFile() {
  if (existsSync('.env')) return;
  copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example');
}

// A second, separate database for `npm test`, which wipes its data on every run.
function createTestDatabase() {
  try {
    execSync('docker compose exec -T db createdb -U chalk chalk_test', { stdio: 'ignore' });
    console.log('Created the chalk_test database');
  } catch {
    // It already exists. Nothing to do.
  }
}

function checkDockerIsRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.error('\nDocker is not running. Open Docker Desktop, wait for it to start, then run `npm run setup` again.');
    process.exit(1);
  }
}

createEnvFile();
checkDockerIsRunning();

// --wait blocks until the database's healthcheck (in docker-compose.yml) says it's ready.
run('docker compose up -d --wait');
createTestDatabase();

// Create (or update) the tables from prisma/migrations, then fill them with fake data.
run('npx prisma migrate deploy');
run('npm run db:seed');

console.log('\nAll set! Run `npm run dev` and open http://localhost:3000');
