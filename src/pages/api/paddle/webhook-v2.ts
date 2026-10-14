/**
 * POST /api/paddle/webhook-v2 — alias of /api/paddle/webhook, same handler.
 *
 * Exists only to rotate PADDLE_WEBHOOK_SECRET without downtime: Paddle refuses
 * two notification destinations on the same URL and destinations can't be
 * deleted, so the fresh-secret destination needs its own URL. Once the Paddle
 * destination is switched over to this URL, the old route can be retired.
 */
export { POST } from './webhook';

// Astro reads `prerender` statically per file, so it can't be re-exported.
export const prerender = false;
