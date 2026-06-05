/**
 * GET /api/license?txn={id} — license-key retrieval for the success page and
 * for in-app auto-activation.
 *
 * Confirms the transaction is completed via the Paddle API, then derives and
 * returns the same key the webhook emailed. Returns nothing else.
 *
 * The app (APP_URL) opens the Paddle overlay itself and calls this endpoint
 * cross-origin to unlock instantly, so GET is exposed to that single origin via
 * CORS — exact match, no wildcard. The webhook endpoint stays closed.
 */
import type { APIRoute } from 'astro';
import {
  fetchTransaction,
  transactionDate,
  isCompleted,
} from '../../server/paddle';
import { deriveLicenseKey } from '../../server/license';
import { requireEnv } from '../../server/env';
import { APP_URL } from '../../lib/site';

export const prerender = false;

const TXN_ID = /^txn_[a-z0-9]+$/i;

/** CORS allowance for the app origin only — same-origin /thanks ignores these. */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  Vary: 'Origin',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/** CORS preflight for the app's cross-origin GET. */
export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ url }) => {
  const txnId = url.searchParams.get('txn');
  if (!txnId || !TXN_ID.test(txnId)) {
    return json({ error: 'invalid_transaction_id' }, 400);
  }

  let txn;
  try {
    txn = await fetchTransaction(txnId);
  } catch {
    return json({ error: 'upstream_error' }, 502);
  }

  if (!txn) {
    return json({ error: 'not_found' }, 404);
  }
  if (!isCompleted(txn.status)) {
    return json({ error: 'not_completed' }, 409);
  }

  const key = deriveLicenseKey(
    txn.id,
    transactionDate(txn),
    requireEnv('LICENSE_SIGNING_KEY'),
  );
  return json({ key }, 200);
};
