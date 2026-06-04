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
| `/privacy`       | Privacy policy (rendered from `PRIVACY.md`)                     |
| `/terms`         | Terms of service (rendered from `TERMS.md`)                     |
| `/forms`         | Index of all 39 form guides, grouped by chain                  |
| `/forms/{slug}`  | Individual form guide (`slug` = `exercise_id`)                 |

## Quick start

```bash
npm install
npm run sync-content   # copy fiches from ../qualireps-v2 (see below)
npm run dev            # http://localhost:4321
npm run build          # static build → dist/  (prebuild auto-runs sync-content)
npm run preview        # serve the built dist/
```

Requirements: Node 20+ (developed on Node 24). No third-party CDNs — Inter is
self-hosted (`public/fonts/`), QR codes are generated at build time.

## Project structure

```
qualireps-site/
├─ astro.config.mjs        # site, output: static, i18n (en default, /fr/), sitemap
├─ vercel.json             # security headers (CSP, HSTS, …) + build config
├─ PRIVACY.md, TERMS.md    # legal copy (source of truth, rendered by /privacy, /terms)
├─ scripts/
│  └─ sync-content.js      # copies coach-content/ from ../qualireps-v2
├─ public/
│  ├─ fonts/               # self-hosted Inter (variable, latin woff2)
│  ├─ icons/               # favicon + app icons
│  ├─ og-default.svg       # single brand OG image (V1 placeholder — see below)
│  └─ robots.txt
└─ src/
   ├─ content.config.ts    # `forms` collection (zod schema)
   ├─ content/forms/       # SYNCED fiches (committed — see "Content sync")
   ├─ layouts/Base.astro   # head/SEO, header, footer, GoatCounter placeholder
   ├─ components/          # PlatformInstall, FicheCard, PlayBadge, QRCode, LangSwitcher
   ├─ lib/                 # platform.ts, playBilling.ts, content.ts, site.ts
   ├─ pages/               # index, pricing, privacy, terms, forms/
   └─ styles/global.css    # brand tokens + prose
```

## Content sync (`scripts/sync-content.js`)

The app repo **`qualireps-v2`** is the single source of truth for the perfect
form guides. This site never edits fiches directly — it copies them:

- **Source:** `../qualireps-v2/coach-content/` (a sibling of this repo), or set
  `QUALIREPS_V2_DIR=/path/to/qualireps-v2`.
- **Destination:** `src/content/forms/`.
- Run `npm run sync-content`. It also runs automatically on `prebuild`.

**`src/content/forms/` is committed to git** (not ignored). The deploy build
(Vercel) has no access to the `qualireps-v2` sibling, so the synced fiches must
be in version control. If the sibling repo is missing, `sync-content` logs a
warning and uses the committed content as-is (it does not fail the build).

**Workflow when app content changes:** clone/pull `qualireps-v2` as a sibling →
`npm run sync-content` → commit the updated `src/content/forms/` → push.

## ⚠️ Placeholders to resolve before launch

1. **`PLAY_PACKAGE_NAME`** (`src/lib/playBilling.ts`) is the placeholder
   `app.qualireps.twa`. It drives every Play Store deep-link. Replace it with
   the real TWA package name from Play Console (must match the Digital Asset
   Links published for `qualireps.app`).
2. **GoatCounter analytics** (`src/layouts/Base.astro`) is a commented-out
   snippet. Create a GoatCounter account, then uncomment and set the real
   `data-goatcounter` site code. The CSP in `vercel.json` already allows
   `gc.zgo.at` (script) and `qualireps.goatcounter.com` (beacon).
3. **OG image** (`public/og-default.svg`) is a single brand placeholder used on
   every page. Replace with a designed 1200×630 PNG (and update `OG_IMAGE` in
   `src/lib/site.ts`). Per-page OG generation is deferred to Phase 2.
4. **Play badge** (`src/components/PlayBadge.astro`) is an in-house rendition.
   Consider swapping Google's official badge artwork to follow their branding
   guidelines.

## External prerequisites (manual, outside this repo)

1. Confirm the real TWA package name from Play Console → update
   `PLAY_PACKAGE_NAME`.
2. Create a GoatCounter account → activate the analytics snippet.
3. Create a Vercel project linked to `OPGLAM/qualireps-site` (build:
   `npm run build`, output: `dist/`; `vercel.json` is picked up automatically).
4. Point `qualireps.app` DNS (OVH) at Vercel.
5. Verify Digital Asset Links for the `qualireps.app` origin (after the TWA
   build is ready).

## i18n

Astro i18n: `defaultLocale: 'en'`, `locales: ['en', 'fr']`,
`prefixDefaultLocale: false`. English is served at `/`. For V1 there is no
French content, so `/fr` and `/fr/` redirect to `/`. Form sheets are EN-only
(`/forms/{slug}`). `LangSwitcher.astro` renders the structure but stays hidden
while only one language exists.

## Security headers

`vercel.json` sets a Content-Security-Policy (self + GoatCounter origins, no
external scripts beyond `gc.zgo.at`, `img-src 'self' data:`), HSTS,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and
`X-Frame-Options`. `script-src` includes `'unsafe-inline'` because pages embed
JSON-LD structured data inline; all executable scripts are Astro-bundled and
served from `'self'`.

## Out of scope (Phase 2)

Per-page OG generation, `/about`, `/learn/`, FR translations,
`getInstalledRelatedApps` detection, real GoatCounter activation, DNS, Vercel
project creation.
