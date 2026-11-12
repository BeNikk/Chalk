# Email links: verifying emails and resetting passwords

## What the links are for

- **Verify your email**: proves the email address is really yours. You can't log in until you click it.
- **Reset your password**: lets you choose a new password if you forgot the old one.

Both work the same way.

## How a link works

1. The server makes a long **random token**, like `9f2c…e41a` (64 characters). Nobody can guess it.
2. It puts the token in a link and emails it to you:
   `https://chalk-client.vercel.app/verify.html?token=9f2c…e41a`
3. It saves a **hash** of the token in the `EmailToken` table, with an expiry time (24 hours to verify, 1 hour to reset).
4. When you click, the page sends the token back. The server hashes it, looks for a matching row that hasn't expired or been used, and marks it **used**.

Because only the hash is stored, someone who sees the database still can't use your links. The same idea protects passwords; see [passwords.md](passwords.md).

## Not giving away who has an account

If "Forgot password" said *"no account with that email"*, anyone could type in emails to find out who uses Chalk. So it always answers: *"If that email has an account, we sent a link."*

## Where emails come from

`server/services/email.js` sends them with [Resend](https://resend.com). On your laptop there's no Resend key, so emails are **printed in the terminal** instead. Copy the link from there to try the flow yourself.

## Learn more

- [Forgot password cheat sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Resend: send email with Node.js](https://resend.com/docs/send-with-nodejs)
