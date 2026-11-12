// Checks req.body against a Zod schema. Bad input gets a 400 with a friendly message;
// good input is cleaned up (trimmed, lowercased) and passed on. See docs/help/validation.md

import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      const firstMessage = result.error.issues[0].message;
      return res.status(400).json({ error: firstMessage, fields: fieldErrors });
    }

    req.body = result.data;
    next();
  };
}

// The biggest number a database id (Postgres "integer") can hold.
const MAX_ID = 2147483647;

// Turns an id from the address (like the 7 in /api/posts/7) into a number, or null if it isn't one.
export function readId(value) {
  if (!/^\d+$/.test(value ?? '')) return null; // digits only
  const id = Number(value);
  return id > 0 && id <= MAX_ID ? id : null;
}
