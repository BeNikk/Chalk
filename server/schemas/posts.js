// What a new or edited post (and a glance event) must look like. New to Zod? See docs/help/validation.md

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

export const updatePostSchema = z
  .object({
    label: z.enum(LABELS, 'Pick a label for your post.').optional(),
    // When omitted, leave the existing title alone; when empty or null, clear it.
    title: z
      .string()
      .trim()
      .max(120, 'Titles can be at most 120 characters.')
      .nullable()
      .optional()
      .transform((title) => (title === undefined ? undefined : title || null)),
    body: z
      .string()
      .trim()
      .min(1, 'Write something first.')
      .max(5000, 'Posts can be at most 5000 characters.')
      .optional(),
  })
  .refine(
    (data) => data.label !== undefined || data.title !== undefined || data.body !== undefined,
    { message: 'Change at least one field.' },
  );

export const recordGlanceSchema = z.object({
  readDurationMs: z
    .number('Read duration must be a number.')
    .int('Read duration must be a whole number.')
    .min(2000, 'Keep reading a little longer before registering a glance.')
    .max(3600000, 'Invalid read duration.'),
});
