import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface VerifiedWebhookRequest extends Request {
  webhookPayload?: any;
  webhookProvider?: 'paystack' | 'payfast';
  webhookSignature?: string;
}

/**
 * Verify Paystack webhook signature
 * https://paystack.com/docs/webhooks/verifying-signatures/
 */
export function verifyPaystackSignature(
  req: VerifiedWebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-paystack-signature'] as string;
  
  if (!signature) {
    console.error('[webhook] Paystack: Missing signature header');
    res.status(401).json({ error: 'Unauthorized: Missing signature' });
    return;
  }
  
  if (!env.PAYSTACK_SECRET_KEY) {
    console.error('[webhook] Paystack secret key not configured');
    res.status(500).json({ error: 'Webhook configuration error' });
    return;
  }
  
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== signature) {
    console.error('[webhook] Paystack: Signature verification failed');
    res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    return;
  }
  
  req.webhookPayload = req.body;
  req.webhookProvider = 'paystack';
  req.webhookSignature = signature;
  
  next();
}

/**
 * Verify PayFast webhook signature
 * https://www.payfast.co.za/Help/API/API_ITN
 */
export function verifyPayfastSignature(
  req: VerifiedWebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const signature = req.body.signature;
  
  if (!signature) {
    console.error('[webhook] PayFast: Missing signature in body');
    res.status(401).json({ error: 'Unauthorized: Missing signature' });
    return;
  }
  
  if (!env.PAYFAST_PASSPHRASE) {
    console.error('[webhook] PayFast passphrase not configured');
    res.status(500).json({ error: 'Webhook configuration error' });
    return;
  }
  
  // Build signature string from POST data
  const pfData = { ...req.body };
  delete pfData.signature;
  
  let pfOutput = '';
  for (const [key, value] of Object.entries(pfData)) {
    if (value !== '' && value !== null && value !== undefined) {
      pfOutput += `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}&`;
    }
  }
  
  // Add passphrase
  pfOutput += `passphrase=${encodeURIComponent(env.PAYFAST_PASSPHRASE).replace(/%20/g, '+')}`;
  
  // Generate MD5 hash
  const hash = crypto.createHash('md5').update(pfOutput).digest('hex');
  
  if (hash !== signature) {
    console.error('[webhook] PayFast: Signature verification failed');
    res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    return;
  }
  
  req.webhookPayload = pfData;
  req.webhookProvider = 'payfast';
  req.webhookSignature = signature;
  
  next();
}

/**
 * Idempotency check: prevent duplicate webhook processing
 * Store webhook IDs in memory (use database for production)
 */
const processedWebhooks = new Set<string>();

export function checkIdempotency(
  req: VerifiedWebhookRequest,
  res: Response,
  next: NextFunction
): void {
  const provider = req.webhookProvider;
  const payload = req.webhookPayload;
  
  let idempotencyKey: string | null = null;
  
  if (provider === 'paystack') {
    idempotencyKey = `paystack-${payload?.data?.reference}`;
  } else if (provider === 'payfast') {
    idempotencyKey = `payfast-${payload?.m_payment_id}`;
  }
  
  if (!idempotencyKey) {
    console.warn('[webhook] Could not extract idempotency key');
    return next();
  }
  
  if (processedWebhooks.has(idempotencyKey)) {
    console.log(`[webhook] Duplicate webhook detected (${idempotencyKey}), returning 200`);
    res.json({ status: 'success', cached: true });
    return;
  }
  
  processedWebhooks.add(idempotencyKey);
  
  // Clean up after 1 hour to prevent memory leak
  setTimeout(() => processedWebhooks.delete(idempotencyKey!), 3600000);
  
  next();
}
