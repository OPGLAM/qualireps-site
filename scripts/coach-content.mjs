// @ts-check
/**
 * Shared helpers for the perfect-form-guide content, which lives in the
 * sibling qualireps-v2 repo (`coach-content/`) and is copied into this site's
 * `src/content/forms/` at a pinned commit.
 *
 * Used by `scripts/sync-content.js` (the copy) and by
 * `src/content/forms.sync.test.ts` (the drift check), so both read the source
 * the same way.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** This repo's root. */
export const ROOT = path.resolve(__dirname, '..');

/** Folder of the source repo that holds the guides. */
export const SOURCE_DIR = 'coach-content';

/** Where the guides land in this site. */
export const DEST = path.resolve(ROOT, 'src', 'content', 'forms');

/** File recording the qualireps-v2 commit the guides were copied from. */
export const SHA_FILE = path.join(DEST, '.source-sha');

/** The qualireps-v2 checkout: $QUALIREPS_V2_DIR, or the sibling folder. */
export function v2Dir() {
  return process.env.QUALIREPS_V2_DIR
    ? path.resolve(process.env.QUALIREPS_V2_DIR)
    : path.resolve(ROOT, '..', 'qualireps-v2');
}

/** True when `dir` is a git checkout we can read. */
export function isGitRepo(dir) {
  if (!existsSync(dir)) return false;
  try {
    git(dir, ['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} cwd
 * @param {string[]} args
 * @returns {Buffer}
 */
export function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Full 40-char SHA for `rev`, or throws if it is not a commit in `dir`. */
export function resolveCommit(dir, rev) {
  return git(dir, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`])
    .toString()
    .trim();
}

/** Markdown is compared and stored with LF line endings. */
export function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

/**
 * Reads `coach-content/` at commit `sha` via `git archive`, independent of the
 * working tree. Returns a map of path (relative to coach-content/, forward
 * slashes) → file text.
 *
 * @param {string} dir
 * @param {string} sha
 * @returns {Map<string, string>}
 */
export function readSourceAt(dir, sha) {
  const tar = git(dir, ['archive', '--format=tar', sha, SOURCE_DIR]);
  const files = new Map();
  for (const entry of parseTar(tar)) {
    const prefix = `${SOURCE_DIR}/`;
    if (!entry.name.startsWith(prefix)) continue;
    files.set(entry.name.slice(prefix.length), entry.data.toString('utf8'));
  }
  return files;
}

/**
 * Minimal reader for the ustar/pax archives `git archive` writes: regular
 * files only, honoring pax `path` records and the ustar prefix field.
 *
 * @param {Buffer} buf
 * @returns {{ name: string, data: Buffer }[]}
 */
function parseTar(buf) {
  const out = [];
  let offset = 0;
  /** @type {string | null} */
  let paxPath = null;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const field = (start, len) =>
      header.subarray(start, start + len).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(field(124, 12).trim() || '0', 8);
    const type = field(156, 1) || '0';
    const prefix = field(345, 155);
    const name = prefix ? `${prefix}/${field(0, 100)}` : field(0, 100);
    const data = buf.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;

    if (type === 'x') {
      const match = /\d+ path=([^\n]*)\n/.exec(data.toString('utf8'));
      paxPath = match ? match[1] : null;
      continue;
    }
    if (type === '0') out.push({ name: paxPath ?? name, data });
    paxPath = null;
  }
  return out;
}

/**
 * Reads the synced guides on disk (everything under src/content/forms/ except
 * the SHA file). Same shape as `readSourceAt`.
 *
 * @returns {Promise<Map<string, string>>}
 */
export async function readDest() {
  const files = new Map();
  /** @param {string} dir */
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (full !== SHA_FILE) {
        const rel = path.relative(DEST, full).split(path.sep).join('/');
        files.set(rel, await readFile(full, 'utf8'));
      }
    }
  }
  await walk(DEST);
  return files;
}
