/**
 * Launch feature flags.
 *
 * These gate functionality that is built but not yet live, so the relevant
 * chantier only has to flip one boolean rather than re-author markup.
 */

/**
 * Paddle checkout is live: /pricing routes to /buy, which opens the Paddle
 * overlay. Flip back to `false` to return the Buy button to its disabled
 * "Checkout opens at launch" state.
 */
export const CHECKOUT_LIVE = true;

/** Where the Paddle checkout will live once CHECKOUT_LIVE flips. */
export const BUY_URL = '/buy';

/**
 * The Google Play TWA distribution channel is postponed to a conditional V1.5.
 * While `false`, all Play Store markup (badges, deep-links, QR) stays gated out
 * of the build. The Play-related components are kept, not deleted, so the V1.5
 * TWA chantier only has to flip this flag.
 */
export const PLAY_TWA_ENABLED = false;
