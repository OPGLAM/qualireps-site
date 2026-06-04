import type { CollectionEntry } from 'astro:content';

export type FormEntry = CollectionEntry<'forms'>;
export type ChainKey = 'push' | 'pull' | 'squat' | 'kb_press_path';

/**
 * Chain registry — names and order.
 *
 * The canonical registry is coach-content/index.md (synced to
 * src/content/forms/index.md). These display names and this ordering mirror its
 * section headings ("Push-up path", "Pull-up path", "Squat path", "Kettlebell
 * press path"). Within a chain, fiches are ordered by their `level` frontmatter
 * (the same order index.md tabulates). The KB press chain has a single shared
 * fiche (level: null).
 */
export const CHAINS: { key: ChainKey; name: string }[] = [
  { key: 'push', name: 'Push-up path' },
  { key: 'pull', name: 'Pull-up path' },
  { key: 'squat', name: 'Squat path' },
  { key: 'kb_press_path', name: 'Kettlebell press path' },
];

const CHAIN_NAME = new Map<ChainKey, string>(
  CHAINS.map((c) => [c.key, c.name])
);

export function chainName(key: ChainKey | null): string {
  return key ? (CHAIN_NAME.get(key) ?? key) : 'Other';
}

/** The URL slug for a fiche = its exercise_id. */
export function ficheSlug(entry: FormEntry): string {
  return entry.data.exercise_id;
}

/** First `# H1` line of the markdown body — the exercise display name. */
export function exerciseName(entry: FormEntry): string {
  const m = entry.body?.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : entry.data.exercise_id;
}

/**
 * The italic "essence" line: a standalone single-asterisk italic paragraph
 * (e.g. `*The floor of the whole chain…*`). Excludes `**bold**` meta lines.
 * Returns null when a fiche has none (e.g. the KB press sheet).
 */
export function essenceLine(entry: FormEntry): string | null {
  const lines = entry.body?.split('\n') ?? [];
  for (const raw of lines) {
    const line = raw.trim();
    // single-asterisk italic, not bold (`**…**`)
    if (/^\*[^*].*\*$/.test(line) && !line.startsWith('**')) {
      return line.replace(/^\*/, '').replace(/\*$/, '').trim();
    }
  }
  return null;
}

/**
 * Meta description for a fiche.
 * V1 order: frontmatter `description` (not present yet) → italic essence line →
 * a generic constructed fallback.
 */
export function ficheDescription(entry: FormEntry): string {
  return (
    entry.data.description?.trim() ||
    essenceLine(entry) ||
    `${exerciseName(entry)} — a perfect form guide from the QualiReps ${chainName(
      entry.data.chain
    )}: the movement, the setup, the sensations, the common errors.`
  );
}

/** Strip inline markdown emphasis/code markers from step text. */
function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/(?<!\w)\*(?!\s)/g, '')
    .replace(/(?<!\s)\*(?!\w)/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Steps for HowTo JSON-LD, parsed from the "## The rep" section's bullet list.
 * Returns [] when the fiche has no such section (e.g. the KB press sheet), in
 * which case the page omits the HowTo schema.
 */
export function howToSteps(entry: FormEntry): string[] {
  const body = entry.body ?? '';
  const lines = body.split('\n');
  const steps: string[] = [];
  let inSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      // Enter the section whose heading begins with "The rep".
      inSection = /^##\s+The rep/i.test(line);
      continue;
    }
    if (!inSection) continue;
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      const text = stripInlineMarkdown(bullet[1]);
      if (text) steps.push(text);
    }
  }
  return steps;
}

export type ChainGroup = {
  key: ChainKey;
  name: string;
  fiches: FormEntry[];
};

/** All fiches grouped by chain, in registry order, each chain ordered by level. */
export function groupByChain(entries: FormEntry[]): ChainGroup[] {
  return CHAINS.map(({ key, name }) => {
    const fiches = entries
      .filter((e) => e.data.chain === key)
      .sort((a, b) => (a.data.level ?? 0) - (b.data.level ?? 0));
    return { key, name, fiches };
  }).filter((g) => g.fiches.length > 0);
}

/** Previous / next fiche within the same chain (by level). */
export function neighbors(
  entry: FormEntry,
  all: FormEntry[]
): { prev: FormEntry | null; next: FormEntry | null } {
  if (entry.data.chain === null || entry.data.level === null) {
    return { prev: null, next: null };
  }
  const siblings = all
    .filter((e) => e.data.chain === entry.data.chain && e.data.level !== null)
    .sort((a, b) => (a.data.level ?? 0) - (b.data.level ?? 0));
  const i = siblings.findIndex((e) => e.id === entry.id);
  return {
    prev: i > 0 ? siblings[i - 1] : null,
    next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
  };
}
