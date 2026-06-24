# Product State — qualireps-site (the landing)

_Snapshot derived from the repository on 2026-06-24. Items that could not be
confirmed from code or git are marked **(to verify)**._

## 1. What this repo is

`qualireps-site` is the public landing, legal, and perfect-form-guide site for
**QualiReps**, a strength ledger for daily (Greasing-the-Groove) practice. The
product itself is a separate installable PWA served from `app.qualireps.app`;
this repo is the marketing/legal/SEO front served at the production origin
**https://qualireps.app**. It is a mostly-static Astro site with a small number
of serverless endpoints for Paddle checkout fulfillment.

## 2. Status

- **Last commit (main):** `895abc4` — _copy(landing): single canonical iOS
  install list (all iOS, iPhone + iPad) (#5)_ — 2026-06-24.
- **Live in prod?** The repo is wired for Vercel (`@astrojs/vercel` adapter +
  `vercel.json` headers) and the production origin is `https://qualireps.app`.
  Actual deployment/DNS being live **(to verify)** — not confirmable from the
  repo alone.
- Launch gating flags: `CHECKOUT_LIVE = true` (Paddle checkout live),
  `PLAY_TWA_ENABLED = false` (Google Play channel postponed to V1.5).

## 3. Live & working (present in the code)

Pages (`src/pages/`):
- `/` — home: hero, freemium/free-demo explainer, three-platform install block.
- `/pricing` — single-story pricing (9,99 €, lifetime, no subscription).
- `/buy` — Paddle checkout overlay (gated by `CHECKOUT_LIVE`).
- `/thanks` — purchase success page; surfaces the issued license key.
- `/privacy`, `/terms`, `/refund` — legal pages rendered from `PRIVACY.md`,
  `TERMS.md`, `REFUND.md`.
- `/forms` — index of 39 perfect-form guides, grouped by chain (push / pull /
  squat / kettlebell press).
- `/forms/{slug}` — individual form guide (`slug` = `exercise_id`).

API routes (serverless, `prerender = false`):
- `GET /api/license?txn={id}` — license-key retrieval for the success page and
  in-app auto-activation (CORS locked to the `app.qualireps.app` origin).
- `POST /api/paddle/webhook` — Paddle webhook fulfillment (issues/email license
  key on completed purchase).

Components (`src/components/`): `PlatformInstall` (Android/Desktop/iOS install
steps; iOS uses the single canonical 4-step list covering iPhone + iPad),
`PaddlePrice` (localized price via `Paddle.PricePreview` with 9,99 € static
fallback), `PlayBadge` + `QRCode` (gated behind `PLAY_TWA_ENABLED`), `FicheCard`,
`Logo`.

Other: GoatCounter analytics snippet is live in `src/layouts/Base.astro`
(posts to `qualireps.goatcounter.com`; account existence **(to verify)**).
Form content is synced (committed) from the `qualireps-v2` app repo via
`scripts/sync-content.js`.

## 4. In progress / pending

- **No open TODO/FIXME markers** in `src/`.
- **Unmerged local branches** all appear to be leftover source branches of
  already-merged squash PRs (#1–#5), not active work:
  - `feat/ios-install-steps` — content already in `main` (#5); safe to delete.
  - `chore/faq-precision-and-pricing-log` — older 3-step iOS list, superseded by
    the canonical list now in `main`.
  - `feat/localized-pricing` — localized pricing already in `main` (#3).
  - `feat/messaging-alignment` — source of the messaging copy already in `main`
    (#1).
  - `feat/landing-copy-fix` — copy + "remove FR toggle / i18n stub" work; `main`
    is already English-only with an empty `src/pages/fr/`, so this looks
    superseded **(to verify before deleting)**.
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
- **Fonts/assets:** self-hosted Inter (`public/fonts/`), no third-party CDNs
  beyond GoatCounter.
- **Content pipeline:** `scripts/sync-content.js` copies form guides from the
  sibling `qualireps-v2` repo into `src/content/forms/` (committed to git so the
  Vercel build needs no sibling access).

## 7. Known issues / risks

- `PLAY_PACKAGE_NAME` is the placeholder `app.qualireps.twa` — must be replaced
  with the real Play Console package before any V1.5 Play TWA launch (and must
  match published Digital Asset Links).
- OG image is a single placeholder SVG used on every page (no per-page OG yet).
- Production deployment, DNS (`qualireps.app` → Vercel), and the GoatCounter
  account are not confirmable from the repo **(to verify)**.
- Several stale local feature branches linger after squash-merges; pruning them
  would avoid confusion about what is actually pending.
- Form guides depend on an out-of-repo source (`qualireps-v2`); the committed
  copy can drift if a sync is forgotten after app-content changes.
