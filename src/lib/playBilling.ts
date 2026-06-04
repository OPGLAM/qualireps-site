/**
 * Play Billing / Play Store constants for the landing site.
 *
 * This is a trimmed copy of the relevant constants from
 * qualireps-v2/src/lib/utils/playBilling.ts. The site only needs to build the
 * Play Store listing URL; it never touches the Digital Goods API.
 */

/** The single one-time managed product (lifetime unlock). For reference. */
export const SKU_LIFETIME = 'qualireps_lifetime';

/**
 * The TWA's Android package name.
 *
 * ⚠️ PLACEHOLDER — `app.qualireps.twa` is the documented default until the
 * Trusted Web Activity wrapper is finalized in Play Console. It MUST be
 * replaced with the real package name before launch (it must also match the
 * Digital Asset Links published for qualireps.app). See README → External
 * prerequisites.
 */
export const PLAY_PACKAGE_NAME = 'app.qualireps.twa';

/** Play Store listing deep-link for a package name. */
export function getPlayStoreUrl(packageName: string): string {
  return `https://play.google.com/store/apps/details?id=${encodeURIComponent(
    packageName
  )}`;
}

/** The canonical Play Store URL for QualiReps (uses the placeholder package). */
export const PLAY_STORE_URL = getPlayStoreUrl(PLAY_PACKAGE_NAME);
