// What the settings form and the admin's moderator form may send. See docs/help/validation.md

import { z } from 'zod';

// Every theme in public/themes/ must be listed here (scripts/check-themes.js checks this).
export const THEMES = ['default', 'chalkboard'];

export const updateMeSchema = z.object({
  bio: z.string().trim().max(160, 'Bios can be at most 160 characters.').optional(),
  theme: z.enum(THEMES, 'Pick one of the themes.').optional(),
});
