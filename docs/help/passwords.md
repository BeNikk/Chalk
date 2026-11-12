# Passwords and hashing

## Never store the real password

If Chalk saved passwords as they were typed, anyone who got a copy of the database (a bug, a stolen laptop, a careless backup) would get everyone's password. Since people reuse passwords, that would also unlock their email and other accounts.

So Chalk stores a **hash** instead.

## What a hash is

A hash function turns text into a scrambled string. It only works in one direction:

```
"chalk-dev-password"  →  "$2b$10$Gk0y8C...9mQe"   (easy)
"$2b$10$Gk0y8C...9mQe"  →  ???                    (practically impossible)
```

When you log in, Chalk hashes what you typed and checks whether it matches the stored hash. It never needs to know your real password.

## Why bcrypt

Chalk uses **bcrypt** (`server/services/passwords.js`). Two things make it good for passwords:

- **It's slow on purpose.** One hash takes a fraction of a second, which is nothing for a real login but makes guessing billions of passwords impractical. The `ROUNDS` number controls how slow.
- **It adds a random "salt".** Two people with the same password get different hashes, so attackers can't use precomputed tables of common passwords.

## Learn more

- [Password storage cheat sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [How bcrypt works (Auth0 blog)](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
