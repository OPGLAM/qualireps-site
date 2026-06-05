/**
 * License-key delivery email via Resend. Plain text, factual — no HTML, no
 * tracking. Throws on a non-2xx response so the webhook can let Paddle retry.
 */
import { requireEnv } from './env';

export async function sendLicenseEmail(
  to: string,
  licenseKey: string,
): Promise<void> {
  const text = [
    'Thank you for purchasing QualiReps.',
    '',
    'Your license key:',
    '',
    licenseKey,
    '',
    'Enter it in the app: Settings → License.',
    '',
    'One license covers every platform — Android, iOS, and desktop. Keep this',
    'email; re-enter the key if you reinstall.',
    '',
    'Refund policy: https://qualireps.app/refund',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'QualiReps <license@qualireps.app>',
      to,
      subject: 'Your QualiReps license key',
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API returned ${res.status}`);
  }
}
