// What a new comment must look like. New to Zod? See docs/help/validation.md

import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a comment first.')
    .max(1000, 'Comments can be at most 1000 characters.'),
});
