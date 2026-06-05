/**
 * POST /api/paddle/webhook — Paddle Billing fulfillment.
 *
 * Verifies the Paddle-Signature header, and on `transaction.completed` derives
 * the license key and emails it via Resend. Idempotent: re-delivery re-derives
 * and re-sends the same key (Ed25519 is deterministic), which is acceptable.
 */
import type { APIRoute } from 'astro';
import {
  verifyPaddleSignature,
  fetchCustomerEmail,
  transactionDate,
} from '../../../server/paddle';
import { deriveLicenseKey } from '../../../server/license';
import { sendLicenseEmail } from '../../../server/email';
import { requireEnv } from '../../../server/env';

export const prerender = false;

interface TransactionCompletedData {
  id: string;
  customer_id: string | null;
  billed_at: string | null;
  created_at: string;
}

interface PaddleWebhookEvent {
  event_type: string;
  data: TransactionCompletedData;
}

export const POST: APIRoute = async ({ request }) => {
  // Read the raw body exactly as sent — required for signature verification.
  const raw = await request.text();
  const signature = request.headers.get('paddle-signature');

  if (
    !verifyPaddleSignature(signature, raw, requireEnv('PADDLE_WEBHOOK_SECRET'))
  ) {
    return new Response('Invalid signature', { status: 400 });
  }

  let event: PaddleWebhookEvent;
  try {
    event = JSON.parse(raw) as PaddleWebhookEvent;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Acknowledge everything we don't act on, so Paddle stops retrying.
  if (event.event_type !== 'transaction.completed') {
    return new Response('Ignored', { status: 200 });
  }

  const txn = event.data;
  if (!txn.customer_id) {
    return new Response('No customer on transaction', { status: 200 });
  }

  const email = await fetchCustomerEmail(txn.customer_id);
  if (!email) {
    // Transient/unexpected — let Paddle retry.
    return new Response('Customer email unavailable', { status: 500 });
  }

  const key = deriveLicenseKey(
    txn.id,
    transactionDate(txn),
    requireEnv('LICENSE_SIGNING_KEY'),
  );
  await sendLicenseEmail(email, key);

  return new Response('OK', { status: 200 });
};
