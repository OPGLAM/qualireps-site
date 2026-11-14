# Product State — qualireps-site (the landing)

_Snapshot derived from the repository on 2026-11-14. Items that could not be
confirmed from code or git are marked **(to verify)**._

## 1. What this repo is

`qualireps-site` is the public landing, legal, and perfect-form-guide site for
**QualiReps**, a strength ledger for bodyweight, kettlebell and custom exercises. The
product itself is a separate installable PWA served from `app.qualireps.app`;
this repo is the marketing/legal/SEO front served at the production origin
**https://qualireps.app**. It is a mostly-static Astro site with a small number
of serverless endpoints for Paddle checkout fulfillment.

## 2. Status

- **Last commit (main):** `97fb7e0` — _copy: align site with app lot B
  (qualireps-v2 @ e004800)_ — 2026-11-04. Copy and form guides are being
  aligned with the app's rules v2 (qualireps-v2 @ 810f662): the check set
  (as many clean reps as possible, 2 kept in reserve, max = reps + 2, no 24 h
  rest) is the recommended way to set a max; the full test stays, with 24 h
  of recovery.
- **Live in prod?** The repo is wired for Vercel (`@astrojs/vercel` adapter +
  `vercel.json` headers) and the production origin is `https://qualireps.app`.
  Actual deployment/DNS being live **(to verify)** — not confirmable from the
  repo alone.
- Launch gating flags: `CHECKOUT_LIVE = true` (Paddle checkout live),
  `PLAY_TWA_ENABLED = false` (Google Play channel postponed to V1.5).

## 3. Live & working (present in the code)

Pages (`src/pages/`):
- `/` — home: the strength ledger (sections 0–10 of qualireps-v2's
  `qualireps-audit/Landing page textes.md`), three-platform install block.
- `/how-it-works` — the exact rules (max and check sets, set range, reserve and
  rest, full tests and recovery, breaks, levels and loads, past sets, rest
  days), checked against the app code (qualireps-v2 @ 810f662).
- `/pricing` — single-story pricing (9,99 €, lifetime, no subscription).
- `/buy` — Paddle checkout overlay (gated by `CHECKOUT_LIVE`).
- `/thanks` — purchase success page; surfaces the issued license key.
- `/privacy`, `/terms`, `/refund` — legal pages rendered from `PRIVACY.md`,
  `TERMS.md`, `REFUND.md`.
- `/forms` — index of the perfect-form guides (count derived from the
  collection), grouped by chain (push / pull / squat / kettlebell press).
- `/forms/{slug}` — individual form guide (`slug` = `exercise_id`).

API routes (serverless, `prerender = false`):
- `GET /api/license?txn={id}` — license-key retrieval for the success page and
  in-app auto-activation (CORS locked to the `app.qualireps.app` origin).
- `POST /api/paddle/webhook` — Paddle webhook fulfillment (issues/email license
  key on completed purchase).
- `POST /api/paddle/webhook-v2` — same handler, second URL for zero-downtime
  secret rotation; retire the old route once Paddle points here.

Components (`src/components/`): `PlatformInstall` (Android/Desktop/iOS install
steps; iOS uses the single canonical 4-step list covering iPhone + iPad),
`PaddlePrice` (localized price via `Paddle.PricePreview` with 9,99 € static
fallback), `PlayBadge` + `QRCode` (gated behind `PLAY_TWA_ENABLED`), `FicheCard`,
`Logo`.

Other: GoatCounter analytics snippet is live in `src/layouts/Base.astro`
(posts to `qualireps.goatcounter.com`; account active, collecting since
2026-06-10). Disclosed in `PRIVACY.md` → "Website analytics".
Form content is synced (committed) from the `qualireps-v2` app repo via
`scripts/sync-content.js`.

## 4. In progress / pending

- **No open TODO/FIXME markers** in `src/`.
- Pre-launch placeholders still open (see README): real `PLAY_PACKAGE_NAME`
  (only needed for V1.5 Play TWA), designed OG image, official Play badge art.

## 5. Parked / future

- **Google Play TWA distribution** — postponed to a conditional V1.5; all Play
  markup (badge, deep-links, QR) gated out by `PLAY_TWA_ENABLED = false`. Code
  kept, not deleted.
- **French (FR) translations** — i18n removed for V1; site is English-only.
  `src/pages/fr/` exists but is empty; real FR routes deferred.
- **Phase 2 / out of scope:** per-page OG generation, `/about`, `/learn/`,
  `getInstalledRelatedApps` install detection.

## 6. Tech stack & infra

- **Framework:** Astro `^5.16` (`output: 'static'`), TypeScript strict,
  Tailwind v4 (`@tailwindcss/vite`).
- **Key deps:** `@astrojs/sitemap`, `qrcode` (build-time QR generation),
  `@astrojs/vercel` adapter. Dev: `vitest`, `@astrojs/check`.
- **Deployment:** Vercel. Static pages are prerendered; the two `/api/*` routes
  run as serverless functions. `vercel.json` sets CSP, HSTS, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
- **Paddle integration (merchant of record):** client opens the Paddle overlay
  from `/buy`; `api/paddle/webhook.ts` fulfills purchases; `api/license.ts`
  returns the license key; Ed25519-derived license keys (`src/server/`). Static
  9,99 € fallback price, localized at runtime via `Paddle.PricePreview`.
- **Fonts/assets:** self-hosted Inter (`public/fonts/`); third-party scripts load from cdn.paddle.com and gc.zgo.at.
- **Content pipeline:** `npm run sync-content <sha>` copies form guides from
  `qualireps-v2` at a pinned commit into `src/content/forms/` (committed to git
  so the Vercel build needs no sibling access; SHA recorded in
  `src/content/forms/.source-sha`). The build never syncs.

## 7. Known issues / risks

- `PLAY_PACKAGE_NAME` is the placeholder `app.qualireps.twa` — must be replaced
  with the real Play Console package before any V1.5 Play TWA launch (and must
  match published Digital Asset Links).
- OG image is a single placeholder SVG used on every page (no per-page OG yet).
- Production deployment and DNS (`qualireps.app` → Vercel) are not
  confirmable from the repo **(to verify)**. The GoatCounter account is
  confirmed active (since 2026-06-10).
- Form guides depend on an out-of-repo source (`qualireps-v2`); the committed
  copy can lag the app if a sync is forgotten. `src/content/forms.sync.test.ts`
  catches edits that diverge from the recorded commit, not a missing sync.
