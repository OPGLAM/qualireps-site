/**
 * Platform detection for the IndexedDB-mitigation iOS notice
 * (2026-06-03). The only thing we need to know is "is this iOS Safari?",
 * because Apple's ~7-day non-use IndexedDB purge is platform-specific and
 * cannot be feature-detected.
 *
 * Detection is necessarily user-agent based. We accept:
 *   - iPhone / iPad / iPod Safari (classic iOS UA), AND
 *   - iPadOS reporting itself as desktop Safari ("Request Desktop Website"
 *     is the default on iPad): platform 'MacIntel' + a touch screen.
 * We REJECT iOS in-app browsers (Chrome = CriOS, Firefox = FxiOS, Edge =
 * EdgiOS, Opera = OPiOS, …) — those don't purge the same way and aren't the
 * Safari engine in the relevant sense.
 *
 * No standalone / display-mode requirement: a user browsing in iOS Safari
 * who hasn't installed the PWA is still exposed to the purge, so they should
 * still see the notice.
 *
 * Pure: all inputs are injectable so the matrix is unit-testable without a
 * real navigator.
 *
 * Ported verbatim from qualireps-v2/src/lib/utils/platform.ts.
 */

/** iOS in-app browser markers — these are NOT "iOS Safari" for our purposes. */
const NON_SAFARI_IOS = /CriOS|FxiOS|EdgiOS|OPiOS|mercury|GSA/i;

export function isIOSSafariPWA(
  userAgent: string = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : '',
  platform: string = typeof navigator !== 'undefined'
    ? // `navigator.platform` is deprecated but still the reliable signal for
      // the iPadOS-as-desktop case; no standard replacement exists yet.
      (navigator.platform ?? '')
    : '',
  maxTouchPoints: number = typeof navigator !== 'undefined'
    ? (navigator.maxTouchPoints ?? 0)
    : 0
): boolean {
  // In-app browsers on iOS are excluded outright.
  if (NON_SAFARI_IOS.test(userAgent)) return false;

  // Classic iOS UA.
  const classicIOS = /iPhone|iPad|iPod/.test(userAgent);

  // iPadOS 13+ defaults to a desktop UA: it reports 'MacIntel' but, unlike a
  // real Mac, has a touch screen. A desktop Mac has maxTouchPoints 0.
  const iPadOSAsDesktop = platform === 'MacIntel' && maxTouchPoints > 1;

  return classicIOS || iPadOSAsDesktop;
}

/**
 * True on Android (any browser). Used by the UnlockDialog non-TWA branch to
 * decide whether to offer a Play Store deep-link (Android) vs a plain message
 * (desktop / iOS). Pure: the UA is injectable for tests.
 */
export function isAndroid(
  userAgent: string = typeof navigator !== 'undefined'
    ? navigator.userAgent
    : ''
): boolean {
  return /Android/.test(userAgent);
}
