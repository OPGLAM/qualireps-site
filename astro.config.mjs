// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Canonical production origin. Update if the domain changes.
const SITE = 'https://qualireps.app';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Static by default: every existing page is prerendered. The Vercel adapter
  // is present only so the handful of API/checkout routes that opt out with
  // `export const prerender = false` (src/pages/api/**) run as serverless
  // functions. Adding the adapter does not change the static pages.
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'ignore',

  // i18n: English is the default and served at the root (no /en/ prefix).
  // French routes live under /fr/. For V1 there is no FR content, so /fr is
  // redirected to / (see `redirects` below). Form sheets are EN-only for V1.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // V1: /fr/ is a stub that sends visitors to the English site. When FR
  // content lands (Phase 2), remove these and add real src/pages/fr/* routes.
  // V1: the FR landing path redirects to English. Deeper /fr/* routes don't
  // exist yet (they 404) — acceptable until FR content lands in Phase 2.
  redirects: {
    '/fr': '/',
  },

  integrations: [sitemap()],

  vite: {
    // Cast: @tailwindcss/vite ships its own Vite types which skew slightly from
    // Astro's bundled Vite types (PluginOption vs Plugin<any>[]). Runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
