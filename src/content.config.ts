import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * `forms` — the perfect form guides, synced from qualireps-v2 by
 * `scripts/sync-content.js` into `src/content/forms/`.
 *
 * `index.md` is the human-readable registry (the chain order tables), NOT a
 * fiche, so it is excluded from the collection. It is parsed separately by
 * `src/lib/content.ts` for chain names + order.
 *
 * Frontmatter schema mirrors the convention documented in
 * coach-content/index.md. `description` is optional: the app fiches don't carry
 * one yet (separate qualireps-v2 chantier), so V1 falls back to parsing the
 * body's italic essence line — see `src/lib/content.ts`.
 */
const forms = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/index.md'],
    base: './src/content/forms',
  }),
  schema: z.object({
    exercise_id: z.string(),
    chain: z.enum(['push', 'pull', 'squat', 'kb_press_path']).nullable(),
    level: z.number().int().nullable(),
    kind: z.enum(['bilateral', 'unilateral']),
    unit: z.enum(['reps', 'seconds']),
    // Optional — not yet present in the app fiches. Parsed from body for V1.
    description: z.string().optional(),
  }),
});

export const collections = { forms };
