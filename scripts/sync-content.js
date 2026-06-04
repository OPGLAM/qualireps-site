// @ts-check
/**
 * sync-content.js — Strategy B content sync.
 *
 * Copies the perfect-form-guide markdown (`coach-content/`) from the sibling
 * qualireps-v2 repo into this site's content collection folder
 * (`src/content/forms/`). The app repo is the single source of truth for fiche
 * text; this site never edits fiches directly.
 *
 * Source : ../qualireps-v2/coach-content/
 * Dest   : ./src/content/forms/
 *
 * Run:  npm run sync-content
 * It also runs automatically on `prebuild` (i.e. before every `npm run build`).
 *
 * If qualireps-v2 is not a sibling of this repo, set QUALIREPS_V2_DIR to its
 * path:  QUALIREPS_V2_DIR=/path/to/qualireps-v2 npm run sync-content
 */
import { cp, rm, mkdir, access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC =
  process.env.QUALIREPS_V2_DIR
    ? path.resolve(process.env.QUALIREPS_V2_DIR, 'coach-content')
    : path.resolve(ROOT, '..', 'qualireps-v2', 'coach-content');

const DEST = path.resolve(ROOT, 'src', 'content', 'forms');

/** @param {string} p */
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(SRC))) {
    // Not an error: on the deploy build (e.g. Vercel) the qualireps-v2 sibling
    // doesn't exist, and the site uses the committed src/content/forms/ that a
    // developer synced + committed locally. We skip (exit 0) and leave the
    // existing content untouched. Only re-syncing requires the sibling repo.
    console.warn(
      `\n[sync-content] Source not found: ${SRC}\n` +
        `Skipping sync — using the committed src/content/forms/ as-is.\n` +
        `(To re-sync, clone qualireps-v2 as a sibling repo or set ` +
        `QUALIREPS_V2_DIR to its path.)\n`
    );
    const have = (await exists(DEST)) ? await countMarkdown(DEST) : 0;
    if (have === 0) {
      console.error(
        `[sync-content] No committed content found at ${DEST} either — ` +
          `the build will have no form sheets.`
      );
    }
    return;
  }

  // Clean the destination so removed fiches don't linger.
  await rm(DEST, { recursive: true, force: true });
  await mkdir(DEST, { recursive: true });

  await cp(SRC, DEST, { recursive: true });

  const count = await countMarkdown(DEST);
  console.log(
    `[sync-content] Copied ${count} markdown file(s)\n  from ${SRC}\n  to   ${DEST}`
  );
}

/**
 * Recursively count .md files (sanity log only).
 * @param {string} dir
 */
async function countMarkdown(dir) {
  let n = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) n += await countMarkdown(full);
    else if (entry.name.endsWith('.md')) n += 1;
  }
  return n;
}

main().catch((err) => {
  console.error('[sync-content] Failed:', err);
  process.exit(1);
});
