/**
 * Lot L5: the legal pages, in English and in French with the same value.
 * Each English file has its French twin with the same sections, and the
 * same paragraphs marked as web-only (`<!-- web-only -->` … `<!-- /web-only -->`:
 * buying on this website). The Android app (qualireps-v2 `npm run
 * sync-legal`) leaves those paragraphs out: what is left must not name
 * Paddle nor a price.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const DOCS = ['TERMS', 'PRIVACY', 'REFUND', 'REFUND-ANDROID', 'LEGAL'];
/** The documents the Android app shows (its refund page is the Google Play one). */
const ANDROID_DOCS = ['TERMS', 'PRIVACY', 'REFUND-ANDROID', 'LEGAL'];

const read = (name: string) => readFileSync(path.join(ROOT, name), 'utf8').replace(/\r\n/g, '\n');
const h2 = (md: string) => (md.match(/^## /gm) ?? []).length;
const blocks = (md: string) => (md.match(/<!-- web-only -->/g) ?? []).length;
const closes = (md: string) => (md.match(/<!-- \/web-only -->/g) ?? []).length;
/** The same cut as qualireps-v2 scripts/legal-content.mjs (androidVariant). */
const withoutWebOnly = (md: string) => md.replace(/<!-- web-only -->[\s\S]*?<!-- \/web-only -->\n?/g, '');

describe('legal pages (lot L5)', () => {
  for (const doc of DOCS) {
    it(`${doc}: an English and a French version, same sections, same web-only blocks`, () => {
      const en = read(`${doc}.md`);
      const fr = read(`${doc}.fr.md`);
      expect(h2(fr)).toBe(h2(en));
      expect(blocks(en)).toBe(closes(en));
      expect(blocks(fr)).toBe(closes(fr));
      expect(blocks(fr)).toBe(blocks(en));
      expect(en).toMatch(/^Last updated: \d{1,2} [A-Z][a-z]+ \d{4}$/m);
      expect(fr).toMatch(/^Dernière mise à jour : \d{1,2} [a-zéû]+ \d{4}$/m);
    });
  }

  for (const doc of ANDROID_DOCS) {
    for (const suffix of ['.md', '.fr.md']) {
      it(`${doc}${suffix} without its web-only paragraphs names neither Paddle nor a price`, () => {
        const android = withoutWebOnly(read(`${doc}${suffix}`));
        expect(android).not.toMatch(/paddle/i);
        expect(android).not.toMatch(/€|\b\d+[.,]\d\d\b/);
        expect(android).not.toMatch(/web-only/);
      });
    }
  }

  it('each version says both have the same value, the customer-friendly reading prevailing', () => {
    for (const doc of DOCS) {
      expect(read(`${doc}.md`)).toMatch(/Both versions have the same value\. If they differ, or if a passage is unclear, the interpretation most favourable to you/);
      expect(read(`${doc}.fr.md`)).toMatch(/Les deux versions ont la même valeur\. En cas de divergence entre elles, ou de doute sur un passage, l'interprétation la plus favorable à vous/);
    }
  });
});
