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

  integrations: [sitemap()],

  vite: {
    // Cast: @tailwindcss/vite ships its own Vite types which skew slightly from
    // Astro's bundled Vite types (PluginOption vs Plugin<any>[]). Runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
