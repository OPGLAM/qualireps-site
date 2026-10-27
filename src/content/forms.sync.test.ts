/**
 * Drift check: src/content/forms/ must match qualireps-v2's coach-content/ at
 * the commit recorded in src/content/forms/.source-sha.
 *
 * Needs the qualireps-v2 checkout (sibling folder or $QUALIREPS_V2_DIR) with
 * that commit; skips otherwise, e.g. on Vercel.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SHA_FILE,
  isGitRepo,
  normalize,
  readDest,
  readSourceAt,
  resolveCommit,
  v2Dir,
} from '../../scripts/coach-content.mjs';

const sha = existsSync(SHA_FILE) ? readFileSync(SHA_FILE, 'utf8').trim() : '';
const repo = v2Dir();

function sourceAvailable(): boolean {
  if (!sha || !isGitRepo(repo)) return false;
  try {
    return resolveCommit(repo, sha) === sha;
  } catch {
    return false;
  }
}

describe('form guides source', () => {
  it('records the qualireps-v2 commit they were copied from', () => {
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe.skipIf(!sourceAvailable())('form guides match qualireps-v2', () => {
  it(`equal coach-content/ at the recorded commit`, async () => {
    const source = readSourceAt(repo, sha);
    const dest = await readDest();

    expect([...dest.keys()].sort()).toEqual([...source.keys()].sort());
    for (const [rel, text] of source) {
      expect(normalize(dest.get(rel) ?? ''), rel).toBe(normalize(text));
    }
  });
});
