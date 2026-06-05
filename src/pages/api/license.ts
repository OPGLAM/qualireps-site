/**
 * GET /api/license?txn={id} — license-key retrieval for the success page.
 *
 * Confirms the transaction is completed via the Paddle API, then derives and
 * returns the same key the webhook emailed. Returns nothing else.
 */
import type { APIRoute } from 'astro';
import {
  fetchTransaction,
  transactionDate,
  isCompleted,
} from '../../server/paddle';
import { deriveLicenseKey } from '../../server/license';
import { requireEnv } from '../../server/env';

export const prerender = false;

const TXN_ID = /^txn_[a-z0-9]+$/i;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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
