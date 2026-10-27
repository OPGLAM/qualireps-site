// @ts-check
/**
 * sync-content.js — copy the perfect form guides from qualireps-v2 at a pinned
 * commit.
 *
 * The app repo is the single source of truth for fiche text; this site never
 * edits fiches directly. Guides are copied from a commit, never from a working
 * tree, and the commit is recorded so a test can detect drift.
 *
 * Source : <qualireps-v2>/coach-content/ at <sha>  (via `git archive`)
 * Dest   : ./src/content/forms/  (+ .source-sha)
 *
 * Run:  npm run sync-content <sha>
 * It is NOT part of the build: `npm run build` only uses the committed
 * src/content/forms/. Commit the result after syncing.
 *
 * If qualireps-v2 is not a sibling of this repo, set QUALIREPS_V2_DIR to its
 * path:  QUALIREPS_V2_DIR=/path/to/qualireps-v2 npm run sync-content <sha>
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEST,
  SHA_FILE,
  SOURCE_DIR,
  git,
  isGitRepo,
  normalize,
  readSourceAt,
  resolveCommit,
  v2Dir,
} from './coach-content.mjs';

/** @param {string} message */
function fail(message) {
  console.error(`[sync-content] ${message}`);
  process.exit(1);
}

async function main() {
  const rev = process.argv[2];
  if (!rev) fail('Usage: npm run sync-content <qualireps-v2 commit sha>');

  const repo = v2Dir();
  if (!isGitRepo(repo)) {
    fail(
      `qualireps-v2 not found at ${repo}. Clone it as a sibling repo or set ` +
        `QUALIREPS_V2_DIR to its path.`
    );
  }

  // Refuse while coach-content/ has uncommitted or untracked changes: the
  // commit being copied should be the one the author is looking at.
  const dirty = git(repo, ['status', '--porcelain', '--', SOURCE_DIR])
    .toString()
    .trim();
  if (dirty) {
    fail(
      `qualireps-v2 has uncommitted changes in ${SOURCE_DIR}/:\n${dirty}\n` +
        `Commit or discard them first.`
    );
  }

  let sha;
  try {
    sha = resolveCommit(repo, rev);
  } catch {
    fail(`"${rev}" is not a commit in ${repo}.`);
  }

  const files = readSourceAt(repo, sha);
  if (files.size === 0) fail(`${SOURCE_DIR}/ is empty or missing at ${sha}.`);

  // Clean the destination so removed fiches don't linger.
  await rm(DEST, { recursive: true, force: true });
  for (const [rel, text] of files) {
    const target = path.join(DEST, ...rel.split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, rel.endsWith('.md') ? normalize(text) : text);
  }
  await writeFile(SHA_FILE, `${sha}\n`);

  console.log(
    `[sync-content] Copied ${files.size} file(s) from ${repo} ` +
      `${SOURCE_DIR}/ @ ${sha}\n  to ${DEST}`
  );
}

main().catch((err) => {
  console.error('[sync-content] Failed:', err);
  process.exit(1);
});
