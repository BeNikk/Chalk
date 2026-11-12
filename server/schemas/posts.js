// What a new post must look like. New to Zod? See docs/help/validation.md

import { z } from 'zod';

export const LABELS = ['rant', 'poetry', 'mess', 'music', 'fixit'];

export const createPostSchema = z.object({
  label: z.enum(LABELS, 'Pick a label for your post.'),
  // Optional: an empty title is saved as no title.
  title: z
    .string()
    .trim()
    .max(120, 'Titles can be at most 120 characters.')
    .optional()
    .transform((title) => title || null),
  body: z
    .string()
    .trim()
    .min(1, 'Write something first.')
    .max(5000, 'Posts can be at most 5000 characters.'),
});
