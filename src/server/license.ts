/**
 * License-key derivation and parsing. Pure, no I/O — unit-testable.
 *
 * Key format:  `QR1.<base64url(payload)>.<base64url(signature)>`
 *   payload   = JSON `{"t":"<paddle_transaction_id>","d":"<YYYY-MM-DD>"}`
 *   signature = Ed25519 over the exact payload bytes
 *
 * Derivation is deterministic: the same transaction always yields the same key
 * (Ed25519 is deterministic, the payload key order is fixed). There is no
 * storage — "resend my key" is just re-derivation from the transaction id.
 */
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

/** Version/namespace prefix, so the format can evolve later. */
const PREFIX = 'QR1';

export interface LicensePayload {
  /** Paddle transaction id. */
  t: string;
  /** Purchase date, `YYYY-MM-DD` (UTC). */
  d: string;
}

/** Canonical payload bytes. Key order is fixed (t, then d) for determinism. */
function payloadBytes(payload: LicensePayload): Buffer {
  return Buffer.from(JSON.stringify({ t: payload.t, d: payload.d }), 'utf8');
}

/**
 * Derive the license key for a transaction.
 *
 * @param txnId         Paddle transaction id.
 * @param date          Purchase date, `YYYY-MM-DD`.
 * @param privateKeyB64 Signing key, PKCS8 DER base64 (LICENSE_SIGNING_KEY).
 */
export function deriveLicenseKey(
  txnId: string,
  date: string,
  privateKeyB64: string,
): string {
  const bytes = payloadBytes({ t: txnId, d: date });
  const key = createPrivateKey({
    key: Buffer.from(privateKeyB64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  const signature = sign(null, bytes, key);
  return `${PREFIX}.${bytes.toString('base64url')}.${signature.toString('base64url')}`;
}

export interface ParsedLicenseKey {
  payload: LicensePayload;
  /** The exact payload bytes that were signed (for verification). */
  payloadBytes: Buffer;
  signature: Buffer;
}

/** Parse a key into its parts, or `null` if it is malformed. Does not verify. */
export function parseLicenseKey(key: string): ParsedLicenseKey | null {
  const parts = key.split('.');
  if (parts.length !== 3) return null;
  const [prefix, payloadPart, signaturePart] = parts;
  if (prefix !== PREFIX) return null;

  const bytes = Buffer.from(payloadPart, 'base64url');
  const signature = Buffer.from(signaturePart, 'base64url');

  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    return null;
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).t !== 'string' ||
    typeof (parsed as Record<string, unknown>).d !== 'string'
  ) {
    return null;
  }
  const payload = parsed as LicensePayload;
  return { payload: { t: payload.t, d: payload.d }, payloadBytes: bytes, signature };
}

/**
 * Verify a key against the public key (raw 32-byte, base64url —
 * LICENSE_PUBLIC_KEY). Mirrors the offline check the app performs.
 */
export function verifyLicenseSignature(
  key: string,
  publicKeyRawB64url: string,
): boolean {
  const parsed = parseLicenseKey(key);
  if (!parsed) return false;
  const publicKey = createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: publicKeyRawB64url },
    format: 'jwk',
  });
  return verify(null, parsed.payloadBytes, publicKey, parsed.signature);
}
