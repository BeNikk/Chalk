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
