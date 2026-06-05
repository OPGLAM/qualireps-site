#!/usr/bin/env node
/**
 * Generate an Ed25519 keypair for QualiReps license signing.
 *
 * Prints two values:
 *   - LICENSE_SIGNING_KEY  — the private key (PKCS8 DER, base64). Goes in the
 *     server environment (Vercel). Keep it secret; it signs every license key.
 *   - LICENSE_PUBLIC_KEY   — the public key (raw 32-byte, base64url). Embed it
 *     in the app (qualireps-v2) to verify keys fully offline.
 *
 * Node crypto only, no dependencies. Run: `node scripts/generate-keypair.mjs`.
 */
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');

const signingKey = privateKey
  .export({ type: 'pkcs8', format: 'der' })
  .toString('base64');

// JWK `x` is the raw 32-byte public key, base64url-encoded — the form the app
// can import directly (WebCrypto / @noble/ed25519).
const publicKeyRaw = publicKey.export({ format: 'jwk' }).x;

console.log('# QualiReps license keypair — store securely, generate once.\n');
console.log('# Server env (Vercel), secret — signs license keys:');
console.log(`LICENSE_SIGNING_KEY=${signingKey}\n`);
console.log('# App (qualireps-v2), public — verifies license keys offline:');
console.log(`LICENSE_PUBLIC_KEY=${publicKeyRaw}`);
