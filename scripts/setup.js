// `npm run setup`: gets a fresh copy of Chalk ready to run on your laptop.
// Safe to run again at any time.

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

console.log('\nAll set! Run `npm run dev` and open http://localhost:3000');
