// Turning passwords into hashes, and checking a password against a hash.
// We never store the real password, only the hash.
// New to password hashing? See docs/help/passwords.md

import bcrypt from 'bcryptjs';

// How much work bcrypt does per hash. Higher is safer but slower; 10 is a common choice.
const ROUNDS = 10;

export function hashPassword(password) {
  return bcrypt.hash(password, ROUNDS);
}

export function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
