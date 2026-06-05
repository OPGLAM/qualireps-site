/**
 * Paddle Billing helpers: webhook signature verification and the two read-only
 * API calls we need (transaction + customer email). No SDK — plain fetch.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireEnv } from './env';

/** API base URL, chosen by PADDLE_ENV (defaults to sandbox). */
export function paddleApiBase(): string {
  return process.env.PADDLE_ENV === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com';
}

/**
 * Verify the `Paddle-Signature` header for a webhook.
 *
 * Header format: `ts=<unix>;h1=<hex>`. The signed payload is `<ts>:<rawBody>`,
 * HMAC-SHA256 with the destination secret. The raw body must be passed exactly
 * as received — any reserialization breaks the signature.
 */
export function verifyPaddleSignature(
  header: string | null,
  rawBody: string,
  secret: string,
): boolean {
  if (!header) return false;

  let ts: string | undefined;
  let h1: string | undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === 'ts') ts = v;
    else if (k === 'h1') h1 = v;
  }
  if (!ts || !h1) return false;

  const expected = createHmac('sha256', secret)
    .update(`${ts}:${rawBody}`, 'utf8')
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(h1, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface PaddleTransaction {
  id: string;
  status: string;
  billed_at: string | null;
  created_at: string;
  customer_id: string | null;
}

/** GET /transactions/{id}. Returns null on 404, throws on other errors. */
export async function fetchTransaction(
  txnId: string,
): Promise<PaddleTransaction | null> {
  const res = await fetch(
    `${paddleApiBase()}/transactions/${encodeURIComponent(txnId)}`,
    { headers: { Authorization: `Bearer ${requireEnv('PADDLE_API_KEY')}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Paddle transactions API returned ${res.status}`);
  const body = (await res.json()) as { data: PaddleTransaction };
  return body.data;
}

/** GET /customers/{id} → email. Returns null if unavailable. */
export async function fetchCustomerEmail(
  customerId: string,
): Promise<string | null> {
  const res = await fetch(
    `${paddleApiBase()}/customers/${encodeURIComponent(customerId)}`,
    { headers: { Authorization: `Bearer ${requireEnv('PADDLE_API_KEY')}` } },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { data: { email?: string } };
  return body.data.email ?? null;
}

/**
 * Purchase date (`YYYY-MM-DD`, UTC) for the license payload. Read from the same
 * transaction by both the webhook and /api/license, so derivation is stable.
 */
export function transactionDate(txn: {
  billed_at: string | null;
  created_at: string;
}): string {
  return (txn.billed_at ?? txn.created_at).slice(0, 10);
}

/** Statuses that mean "paid for", per the /api/license contract. */
export function isCompleted(status: string): boolean {
  return status === 'completed' || status === 'paid';
}
