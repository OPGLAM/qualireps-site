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
  // One address per page: no trailing slash. The canonical tags (Base.astro),
  // the sitemap and internal links all use this form, and the Vercel adapter
  // turns this setting into a permanent redirect from the slash form.
  trailingSlash: 'never',

  // Retired form guides → their closest remaining level, permanently. The push
  // path ends at level 17 (qualireps-v2 @ bd5bfda): the shoulder-width and
  // narrow stances (L18–L19) were removed.
  redirects: {
    '/forms/one-arm-push-up-shoulder-stance': {
      status: 301,
      destination: '/forms/one-arm-push-up-wide-stance',
    },
    '/forms/one-arm-push-up-narrow-stance': {
      status: 301,
      destination: '/forms/one-arm-push-up-wide-stance',
    },
  },

  integrations: [
    sitemap({
      // Checkout and post-purchase pages stay out of the index (they also
      // carry a robots noindex meta tag).
      filter: (page) => !/\/(buy|thanks)\/?$/.test(new URL(page).pathname),
    }),
  ],

  vite: {
    // Cast: @tailwindcss/vite ships its own Vite types which skew slightly from
    // Astro's bundled Vite types (PluginOption vs Plugin<any>[]). Runtime is fine.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
