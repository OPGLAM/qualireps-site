# QualiReps — landing site

The marketing + legal + perfect-form-guide site for **QualiReps**, a strength
ledger for daily practice. Static site built with [Astro](https://astro.build/)
(TypeScript strict, Tailwind v4, sitemap). Dark "Industrial Workshop" identity
mirrored from the app (`qualireps-v2`).

Production origin: **https://qualireps.app**

## Pages

| Route            | Content                                                        |
| ---------------- | -------------------------------------------------------------- |
| `/`              | Home — hero, freemium explainer, install block (`#install`)    |
| `/pricing`       | Pricing (9,99 €, lifetime, no subscription)                    |
| `/buy`           | Paddle checkout overlay (gated by `CHECKOUT_LIVE`)             |
| `/thanks`        | Purchase success page — shows the issued license key           |
| `/privacy`       | Privacy policy (rendered from `PRIVACY.md`)                     |
| `/terms`         | Terms of service (rendered from `TERMS.md`)                     |
| `/refund`        | Refund policy (rendered from `REFUND.md`)                       |
| `/forms`         | Index of all 39 form guides, grouped by chain                  |
| `/forms/{slug}`  | Individual form guide (`slug` = `exercise_id`)                 |

## Quick start

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static build → dist/  (uses the committed fiches; never syncs)
npm test               # unit tests + form-guide drift check
npm run preview        # serve the built dist/
```

Requirements: Node 20+ (developed on Node 24). Third-party scripts: Paddle (cdn.paddle.com) and GoatCounter (gc.zgo.at); Inter is
self-hosted (`public/fonts/`), QR codes are generated at build time.

## Project structure

```
qualireps-site/
├─ astro.config.mjs        # site, output: static, sitemap
├─ vercel.json             # security headers (CSP, HSTS, …) + build config
├─ PRIVACY.md, TERMS.md    # legal copy (source of truth, rendered by /privacy, /terms)
├─ scripts/
│  ├─ sync-content.js      # copies coach-content/ from qualireps-v2 at a commit
│  └─ coach-content.mjs    # shared reader (sync + drift test)
├─ public/
│  ├─ fonts/               # self-hosted Inter (variable, latin woff2)
│  ├─ icons/               # favicon + app icons
│  ├─ og-default.svg       # single brand OG image (V1 placeholder — see below)
│  └─ robots.txt
└─ src/
   ├─ content.config.ts    # `forms` collection (zod schema)
   ├─ content/forms/       # SYNCED fiches (committed — see "Content sync")
   ├─ layouts/Base.astro   # head/SEO, header, footer, GoatCounter snippet (live)
   ├─ components/          # PlatformInstall, FicheCard, PlayBadge, QRCode
   ├─ lib/                 # platform.ts, playBilling.ts, content.ts, site.ts
   ├─ pages/               # index, pricing, privacy, terms, forms/
   └─ styles/global.css    # brand tokens + prose
```

## Content sync (`scripts/sync-content.js`)

The app repo **`qualireps-v2`** is the single source of truth for the perfect
form guides. This site never edits fiches directly — it copies them:

- **Source:** `coach-content/` of `../qualireps-v2` (a sibling of this repo),
  or set `QUALIREPS_V2_DIR=/path/to/qualireps-v2`, read **at a given commit**
  with `git archive` — never from the working tree.
- **Destination:** `src/content/forms/`, plus `src/content/forms/.source-sha`
  (the full commit SHA the guides were copied from).
- Run `npm run sync-content <sha>`. It refuses if `coach-content/` has
  uncommitted or untracked changes in qualireps-v2, or if `<sha>` is not a
  commit there. It is **not** part of the build: `npm run build` never copies
  anything.

**`src/content/forms/` is committed to git** (not ignored). The deploy build
(Vercel) has no access to the `qualireps-v2` sibling, so the synced fiches must
be in version control.

**Drift check:** `src/content/forms.sync.test.ts` compares `src/content/forms/`
with `coach-content/` at the SHA in `.source-sha`. It runs whenever the
qualireps-v2 checkout (with that commit) is available, and skips otherwise
(e.g. on Vercel). `.gitattributes` keeps every `.md` in LF so the comparison is
exact on Windows too.

**Workflow when app content changes:** edit and commit in
`qualireps-v2/coach-content/` → `npm run sync-content <sha>` here → `npm test`
→ commit as `content: sync forms from qualireps-v2@<short sha>` → push.

## ⚠️ Placeholders to resolve before launch

1. **`PLAY_PACKAGE_NAME`** (`src/lib/playBilling.ts`) is the placeholder
   `app.qualireps.twa`. It drives every Play Store deep-link. Replace it with
   the real TWA package name from Play Console (must match the Digital Asset
   Links published for `qualireps.app`). Note: all Play markup is currently
   gated out by `PLAY_TWA_ENABLED = false` (Play TWA postponed to V1.5).
2. **OG image** (`public/og-default.svg`) is a single brand placeholder used on
   every page. Replace with a designed 1200×630 PNG (and update `OG_IMAGE` in
   `src/lib/site.ts`). Per-page OG generation is deferred to Phase 2.
3. **Play badge** (`src/components/PlayBadge.astro`) is an in-house rendition.
   Consider swapping Google's official badge artwork to follow their branding
   guidelines.

## External prerequisites (manual, outside this repo)

1. Confirm the real TWA package name from Play Console → update
   `PLAY_PACKAGE_NAME` (only needed when the Play TWA channel ships in V1.5).
2. GoatCounter analytics is live: the snippet in `src/layouts/Base.astro` posts
   to `qualireps.goatcounter.com` (account active, collecting since 2026-06-10).
3. Create a Vercel project linked to `OPGLAM/qualireps-site` (build:
   `npm run build`, output: `dist/`; `vercel.json` is picked up automatically).
4. Point `qualireps.app` DNS (OVH) at Vercel.
5. Verify Digital Asset Links for the `qualireps.app` origin (after the TWA
   build is ready).

## Language

English only. The site is served at `/` with `<html lang="en">`; form sheets
live at `/forms/{slug}`. (The FR toggle and i18n stub were removed for V1; add
real `src/pages/fr/*` routes and i18n config when French content lands.)

## Security headers

`vercel.json` sets a Content-Security-Policy (self + GoatCounter origins, no
external scripts beyond `gc.zgo.at`, `img-src 'self' data:`), HSTS,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and
`X-Frame-Options`. `script-src` includes `'unsafe-inline'` because pages embed
JSON-LD structured data inline; all executable scripts are Astro-bundled and
served from `'self'`.

## Out of scope (Phase 2)

Per-page OG generation, `/about`, `/learn/`, FR translations,
`getInstalledRelatedApps` detection, DNS, Vercel project creation.
