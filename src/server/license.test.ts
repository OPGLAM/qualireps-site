import { describe, it, expect } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import {
  deriveLicenseKey,
  parseLicenseKey,
  verifyLicenseSignature,
} from './license';

/** Fresh Ed25519 keypair in the same encodings the tooling/server use. */
function keypair(): { signingKey: string; publicKeyRaw: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const x = publicKey.export({ format: 'jwk' }).x;
  if (!x) throw new Error('missing public key material');
  return {
    signingKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
    publicKeyRaw: x,
  };
}

describe('deriveLicenseKey', () => {
  it('is deterministic for identical inputs', () => {
    const { signingKey } = keypair();
    const a = deriveLicenseKey('txn_123', '2026-06-05', signingKey);
    const b = deriveLicenseKey('txn_123', '2026-06-05', signingKey);
    expect(a).toBe(b);
  });

  it('changes when the transaction id or date changes', () => {
    const { signingKey } = keypair();
    const base = deriveLicenseKey('txn_1', '2026-06-05', signingKey);
    expect(deriveLicenseKey('txn_2', '2026-06-05', signingKey)).not.toBe(base);
    expect(deriveLicenseKey('txn_1', '2026-06-06', signingKey)).not.toBe(base);
  });

  it('has the QR1 prefix and three dot-separated parts', () => {
    const { signingKey } = keypair();
    const key = deriveLicenseKey('txn_123', '2026-06-05', signingKey);
    expect(key.startsWith('QR1.')).toBe(true);
    expect(key.split('.')).toHaveLength(3);
  });
});

describe('parseLicenseKey', () => {
  it('round-trips the payload', () => {
    const { signingKey } = keypair();
    const key = deriveLicenseKey('txn_abc', '2026-06-05', signingKey);
    const parsed = parseLicenseKey(key);
    expect(parsed).not.toBeNull();
    expect(parsed?.payload).toEqual({ t: 'txn_abc', d: '2026-06-05' });
  });

  it('returns null on malformed input', () => {
    expect(parseLicenseKey('nope')).toBeNull();
    expect(parseLicenseKey('QR1.onlytwo')).toBeNull();
    expect(parseLicenseKey('XX1.aaa.bbb')).toBeNull();
    expect(parseLicenseKey('QR1.!!!notjson.bbb')).toBeNull();
  });
});

describe('verifyLicenseSignature', () => {
  it('accepts a key signed by the matching private key', () => {
    const { signingKey, publicKeyRaw } = keypair();
    const key = deriveLicenseKey('txn_xyz', '2026-06-05', signingKey);
    expect(verifyLicenseSignature(key, publicKeyRaw)).toBe(true);
  });

  it('rejects a key under a different public key', () => {
    const a = keypair();
    const b = keypair();
    const key = deriveLicenseKey('txn_xyz', '2026-06-05', a.signingKey);
    expect(verifyLicenseSignature(key, b.publicKeyRaw)).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const { signingKey, publicKeyRaw } = keypair();
    const key = deriveLicenseKey('txn_xyz', '2026-06-05', signingKey);
    const [prefix, , signature] = key.split('.');
    const forged = Buffer.from(
      JSON.stringify({ t: 'txn_OTHER', d: '2026-06-05' }),
      'utf8',
    ).toString('base64url');
    const tampered = `${prefix}.${forged}.${signature}`;
    expect(verifyLicenseSignature(tampered, publicKeyRaw)).toBe(false);
  });
});
